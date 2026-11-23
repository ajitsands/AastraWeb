<?php

class CategoryModel extends Model
{
    public function getAll(bool $onlyActive = false): array
    {
        (new SubCategoryModel())->ensureSchema();
        $where = $onlyActive ? 'WHERE c.is_active = 1' : '';
        $sql = "
            SELECT c.*,
                   (SELECT COUNT(*) FROM items i WHERE i.category_id = c.id AND i.is_active = 1) AS item_count,
                   (SELECT COUNT(*) FROM catalogue_groups g WHERE g.category_id = c.id AND g.is_active = 1) AS group_count,
                   (SELECT COUNT(*) FROM sub_categories s WHERE s.category_id = c.id AND s.is_active = 1) AS sub_category_count
            FROM categories c
            $where
            ORDER BY c.chapter_number ASC, c.sort_order ASC, c.name ASC
        ";
        $cats = $this->db->query($sql)->fetchAll();

        $subWhere = $onlyActive ? 'WHERE is_active = 1' : '';
        $subs = $this->db->query("SELECT * FROM sub_categories $subWhere ORDER BY sort_order ASC, name ASC")->fetchAll();
        $byCat = [];
        foreach ($subs as $s) {
            $byCat[(int)$s['category_id']][] = $s;
        }
        foreach ($cats as &$c) {
            $c['sub_categories'] = $byCat[(int)$c['id']] ?? [];
        }
        return $cats;
    }

    public function findByIdOrSlug($identifier): ?array
    {
        if (is_numeric($identifier)) {
            $stmt = $this->db->prepare('SELECT * FROM categories WHERE id = ? LIMIT 1');
            $stmt->execute([(int)$identifier]);
        } else {
            $stmt = $this->db->prepare('SELECT * FROM categories WHERE slug = ? LIMIT 1');
            $stmt->execute([$identifier]);
        }
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public function create(array $data): array
    {
        $slug = !empty($data['slug']) ? $this->slugify($data['slug']) : $this->slugify($data['name']);
        $slug = $this->ensureUniqueSlug($slug);

        $stmt = $this->db->prepare('
            INSERT INTO categories (name, slug, section_label, side_tab_label, chapter_number, description, image_url, sort_order, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ');
        $stmt->execute([
            trim($data['name']),
            $slug,
            strtoupper(trim($data['section_label'] ?? 'ACCESSORIES')),
            strtoupper(trim($data['side_tab_label'] ?? 'DOOR HARDWARE')),
            (int)($data['chapter_number'] ?? 1),
            $data['description'] ?? null,
            $data['image_url'] ?? null,
            (int)($data['sort_order'] ?? 0),
            isset($data['is_active']) ? (int)(bool)$data['is_active'] : 1,
        ]);

        return $this->findByIdOrSlug((int)$this->db->lastInsertId());
    }

    public function update(int $id, array $data): ?array
    {
        $existing = $this->findByIdOrSlug($id);
        if (!$existing) {
            return null;
        }

        $name = isset($data['name']) ? trim($data['name']) : $existing['name'];
        $slug = !empty($data['slug']) ? $this->slugify($data['slug']) : $existing['slug'];
        if ($slug !== $existing['slug']) {
            $slug = $this->ensureUniqueSlug($slug, $id);
        }

        $stmt = $this->db->prepare('
            UPDATE categories
            SET name = ?, slug = ?, section_label = ?, side_tab_label = ?, chapter_number = ?,
                description = ?, image_url = ?, sort_order = ?, is_active = ?
            WHERE id = ?
        ');
        $stmt->execute([
            $name,
            $slug,
            strtoupper(trim($data['section_label'] ?? $existing['section_label'])),
            strtoupper(trim($data['side_tab_label'] ?? $existing['side_tab_label'])),
            (int)($data['chapter_number'] ?? $existing['chapter_number']),
            array_key_exists('description', $data) ? $data['description'] : $existing['description'],
            array_key_exists('image_url', $data) ? $data['image_url'] : $existing['image_url'],
            (int)($data['sort_order'] ?? $existing['sort_order']),
            array_key_exists('is_active', $data) ? (int)(bool)$data['is_active'] : $existing['is_active'],
            $id,
        ]);

        return $this->findByIdOrSlug($id);
    }

    public function delete(int $id): bool
    {
        $stmt = $this->db->prepare('DELETE FROM categories WHERE id = ?');
        return $stmt->execute([$id]);
    }

    private function ensureUniqueSlug(string $slug, ?int $ignoreId = null): string
    {
        $base = $slug;
        $i = 1;
        while (true) {
            $sql = $ignoreId
                ? 'SELECT id FROM categories WHERE slug = ? AND id != ? LIMIT 1'
                : 'SELECT id FROM categories WHERE slug = ? LIMIT 1';
            $stmt = $this->db->prepare($sql);
            $stmt->execute($ignoreId ? [$slug, $ignoreId] : [$slug]);
            if (!$stmt->fetch()) {
                return $slug;
            }
            $slug = $base . '-' . (++$i);
        }
    }
}
