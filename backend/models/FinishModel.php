<?php

class FinishModel extends Model
{
    public function getAll(bool $onlyActive = false): array
    {
        $where = $onlyActive ? 'WHERE f.is_active = 1' : '';
        $sql = "
            SELECT f.*,
                   (SELECT COUNT(*) FROM item_finishes ifin
                    INNER JOIN items i ON i.id = ifin.item_id
                    WHERE ifin.finish_id = f.id AND i.is_active = 1) AS item_count
            FROM finishes f
            $where
            ORDER BY f.sort_order ASC, f.name ASC
        ";
        return $this->db->query($sql)->fetchAll();
    }

    public function findByIdOrSlug($identifier): ?array
    {
        if (is_numeric($identifier)) {
            $stmt = $this->db->prepare('SELECT * FROM finishes WHERE id = ? LIMIT 1');
            $stmt->execute([(int)$identifier]);
        } else {
            $stmt = $this->db->prepare('SELECT * FROM finishes WHERE slug = ? LIMIT 1');
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
            INSERT INTO finishes (name, slug, code, swatch_hex, swatch_gradient, description, sort_order, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ');
        $stmt->execute([
            trim($data['name']),
            $slug,
            $data['code'] ?? null,
            $data['swatch_hex'] ?? '#B8B8B8',
            $data['swatch_gradient'] ?? null,
            $data['description'] ?? null,
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
            UPDATE finishes
            SET name = ?, slug = ?, code = ?, swatch_hex = ?, swatch_gradient = ?,
                description = ?, sort_order = ?, is_active = ?
            WHERE id = ?
        ');
        $stmt->execute([
            $name,
            $slug,
            array_key_exists('code', $data) ? $data['code'] : $existing['code'],
            $data['swatch_hex'] ?? $existing['swatch_hex'],
            array_key_exists('swatch_gradient', $data) ? $data['swatch_gradient'] : $existing['swatch_gradient'],
            array_key_exists('description', $data) ? $data['description'] : $existing['description'],
            (int)($data['sort_order'] ?? $existing['sort_order']),
            array_key_exists('is_active', $data) ? (int)(bool)$data['is_active'] : $existing['is_active'],
            $id,
        ]);

        return $this->findByIdOrSlug($id);
    }

    public function delete(int $id): bool
    {
        $stmt = $this->db->prepare('DELETE FROM finishes WHERE id = ?');
        return $stmt->execute([$id]);
    }

    private function ensureUniqueSlug(string $slug, ?int $ignoreId = null): string
    {
        $base = $slug;
        $i = 1;
        while (true) {
            $sql = $ignoreId
                ? 'SELECT id FROM finishes WHERE slug = ? AND id != ? LIMIT 1'
                : 'SELECT id FROM finishes WHERE slug = ? LIMIT 1';
            $stmt = $this->db->prepare($sql);
            $stmt->execute($ignoreId ? [$slug, $ignoreId] : [$slug]);
            if (!$stmt->fetch()) {
                return $slug;
            }
            $slug = $base . '-' . (++$i);
        }
    }
}
