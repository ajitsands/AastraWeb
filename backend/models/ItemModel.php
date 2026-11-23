<?php

class ItemModel extends Model
{
    public function getAll(array $filters = []): array
    {
        (new SubCategoryModel())->ensureSchema();
        $conditions = [];
        $params = [];

        if (!empty($filters['only_active'])) {
            $conditions[] = 'i.is_active = 1';
        }
        if (!empty($filters['category_id'])) {
            $conditions[] = 'i.category_id = ?';
            $params[] = (int)$filters['category_id'];
        }
        if (!empty($filters['category_slug'])) {
            $conditions[] = 'c.slug = ?';
            $params[] = $filters['category_slug'];
        }
        if (!empty($filters['sub_category_id'])) {
            $conditions[] = 'i.sub_category_id = ?';
            $params[] = (int)$filters['sub_category_id'];
        }
        if (!empty($filters['sub_category_slug'])) {
            $conditions[] = 'sc.slug = ?';
            $params[] = $filters['sub_category_slug'];
        }
        if (!empty($filters['finish_id'])) {
            $conditions[] = 'EXISTS (SELECT 1 FROM item_finishes ifin WHERE ifin.item_id = i.id AND ifin.finish_id = ?)';
            $params[] = (int)$filters['finish_id'];
        }
        if (!empty($filters['finish_slug'])) {
            $conditions[] = 'EXISTS (SELECT 1 FROM item_finishes ifin INNER JOIN finishes f ON f.id = ifin.finish_id WHERE ifin.item_id = i.id AND f.slug = ?)';
            $params[] = $filters['finish_slug'];
        }
        if (!empty($filters['featured'])) {
            $conditions[] = 'i.is_featured = 1';
        }
        if (!empty($filters['search'])) {
            $conditions[] = '(i.name LIKE ? OR i.code LIKE ? OR i.specifications LIKE ? OR c.name LIKE ? OR sc.name LIKE ?)';
            $q = '%' . trim($filters['search']) . '%';
            array_push($params, $q, $q, $q, $q, $q);
        }

        $where = $conditions ? 'WHERE ' . implode(' AND ', $conditions) : '';

        $sql = "
            SELECT i.*, c.name AS category_name, c.slug AS category_slug,
                   c.section_label, c.side_tab_label, c.chapter_number,
                   sc.name AS sub_category_name, sc.slug AS sub_category_slug
            FROM items i
            INNER JOIN categories c ON c.id = i.category_id
            LEFT JOIN sub_categories sc ON sc.id = i.sub_category_id
            $where
            ORDER BY c.chapter_number ASC, i.sort_order ASC, i.id ASC
        ";

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        $items = $stmt->fetchAll();

        return array_map([$this, 'hydrateItem'], $items);
    }

    public function findByIdOrSlug($identifier): ?array
    {
        (new SubCategoryModel())->ensureSchema();
        $sql = "
            SELECT i.*, c.name AS category_name, c.slug AS category_slug,
                   c.section_label, c.side_tab_label, c.chapter_number,
                   sc.name AS sub_category_name, sc.slug AS sub_category_slug
            FROM items i
            INNER JOIN categories c ON c.id = i.category_id
            LEFT JOIN sub_categories sc ON sc.id = i.sub_category_id
            WHERE " . (is_numeric($identifier) ? 'i.id = ?' : 'i.slug = ?') . "
            LIMIT 1
        ";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([is_numeric($identifier) ? (int)$identifier : $identifier]);
        $row = $stmt->fetch();
        return $row ? $this->hydrateItem($row) : null;
    }

    public function create(array $data): array
    {
        (new SubCategoryModel())->ensureSchema();
        $slug = !empty($data['slug'])
            ? $this->slugify($data['slug'])
            : $this->slugify(($data['code'] ?? '') . '-' . ($data['name'] ?? 'item'));
        $slug = $this->ensureUniqueSlug($slug);

        $images = array_slice($data['images'] ?? [], 0, 6);
        $specTable = $data['spec_table'] ?? null;
        $pdfTemplate = trim($data['pdf_template'] ?? 'standard') ?: 'standard';
        $templateData = $data['template_data'] ?? null;
        $subCatId = !empty($data['sub_category_id']) ? (int)$data['sub_category_id'] : null;

        $stmt = $this->db->prepare('
            INSERT INTO items (category_id, sub_category_id, name, slug, code, subtitle, specifications, footnote, material, images_json, spec_table_json, pdf_template, template_data_json, is_featured, is_active, sort_order)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ');
        $stmt->execute([
            (int)$data['category_id'],
            $subCatId,
            trim($data['name']),
            $slug,
            trim($data['code']),
            $data['subtitle'] ?? null,
            $data['specifications'] ?? '',
            $data['footnote'] ?? '"Special finishes & sizes available upon request subject to minimum order quantity"',
            $data['material'] ?? null,
            json_encode($images, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
            $specTable ? json_encode($specTable, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) : null,
            $pdfTemplate,
            $templateData ? json_encode($templateData, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) : null,
            isset($data['is_featured']) ? (int)(bool)$data['is_featured'] : 0,
            isset($data['is_active']) ? (int)(bool)$data['is_active'] : 1,
            (int)($data['sort_order'] ?? 0),
        ]);

        $itemId = (int)$this->db->lastInsertId();

        if (isset($data['finish_ids']) && is_array($data['finish_ids'])) {
            $this->syncFinishes($itemId, $data['finish_ids']);
        }
        if (isset($data['group_ids']) && is_array($data['group_ids'])) {
            $this->syncGroups($itemId, $data['group_ids']);
        }

        return $this->findByIdOrSlug($itemId);
    }

    public function update(int $id, array $data): ?array
    {
        (new SubCategoryModel())->ensureSchema();
        $existing = $this->findByIdOrSlug($id);
        if (!$existing) {
            return null;
        }

        $slug = !empty($data['slug']) ? $this->slugify($data['slug']) : $existing['slug'];
        if ($slug !== $existing['slug']) {
            $slug = $this->ensureUniqueSlug($slug, $id);
        }

        $images = array_key_exists('images', $data)
            ? array_slice($data['images'] ?? [], 0, 6)
            : $existing['images'];
        $specTable = array_key_exists('spec_table', $data)
            ? $data['spec_table']
            : $existing['spec_table'];
        $pdfTemplate = array_key_exists('pdf_template', $data)
            ? (trim((string)$data['pdf_template']) ?: 'standard')
            : ($existing['pdf_template'] ?? 'standard');
        $templateData = array_key_exists('template_data', $data)
            ? $data['template_data']
            : ($existing['template_data'] ?? null);
        $subCatId = array_key_exists('sub_category_id', $data)
            ? (!empty($data['sub_category_id']) ? (int)$data['sub_category_id'] : null)
            : ($existing['sub_category_id'] ?? null);

        $stmt = $this->db->prepare('
            UPDATE items
            SET category_id = ?, sub_category_id = ?, name = ?, slug = ?, code = ?, subtitle = ?,
                specifications = ?, footnote = ?, material = ?,
                images_json = ?, spec_table_json = ?, pdf_template = ?, template_data_json = ?,
                is_featured = ?, is_active = ?, sort_order = ?
            WHERE id = ?
        ');
        $stmt->execute([
            (int)($data['category_id'] ?? $existing['category_id']),
            $subCatId,
            isset($data['name']) ? trim($data['name']) : $existing['name'],
            $slug,
            isset($data['code']) ? trim($data['code']) : $existing['code'],
            array_key_exists('subtitle', $data) ? $data['subtitle'] : $existing['subtitle'],
            array_key_exists('specifications', $data) ? $data['specifications'] : $existing['specifications'],
            array_key_exists('footnote', $data) ? $data['footnote'] : $existing['footnote'],
            array_key_exists('material', $data) ? $data['material'] : $existing['material'],
            json_encode($images, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
            $specTable ? json_encode($specTable, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) : null,
            $pdfTemplate,
            $templateData ? json_encode($templateData, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) : null,
            array_key_exists('is_featured', $data) ? (int)(bool)$data['is_featured'] : $existing['is_featured'],
            array_key_exists('is_active', $data) ? (int)(bool)$data['is_active'] : $existing['is_active'],
            (int)($data['sort_order'] ?? $existing['sort_order']),
            $id,
        ]);

        if (isset($data['finish_ids']) && is_array($data['finish_ids'])) {
            $this->syncFinishes($id, $data['finish_ids']);
        }
        if (isset($data['group_ids']) && is_array($data['group_ids'])) {
            $this->syncGroups($id, $data['group_ids']);
        }

        return $this->findByIdOrSlug($id);
    }

    public function delete(int $id): bool
    {
        $stmt = $this->db->prepare('DELETE FROM items WHERE id = ?');
        return $stmt->execute([$id]);
    }

    private function syncFinishes(int $itemId, array $finishIds): void
    {
        $this->db->prepare('DELETE FROM item_finishes WHERE item_id = ?')->execute([$itemId]);
        $stmt = $this->db->prepare('INSERT IGNORE INTO item_finishes (item_id, finish_id) VALUES (?, ?)');
        foreach ($finishIds as $fid) {
            if (is_numeric($fid)) {
                $stmt->execute([$itemId, (int)$fid]);
            }
        }
    }

    private function syncGroups(int $itemId, array $groupIds): void
    {
        $this->db->prepare('DELETE FROM catalogue_group_items WHERE item_id = ?')->execute([$itemId]);
        $stmt = $this->db->prepare('INSERT IGNORE INTO catalogue_group_items (group_id, item_id, sort_order) VALUES (?, ?, 0)');
        foreach ($groupIds as $gid) {
            if (is_numeric($gid)) {
                $stmt->execute([(int)$gid, $itemId]);
            }
        }
    }

    public function hydrateItem(array $row): array
    {
        $row['images'] = !empty($row['images_json']) ? (json_decode($row['images_json'], true) ?: []) : [];
        $row['spec_table'] = !empty($row['spec_table_json']) ? json_decode($row['spec_table_json'], true) : null;
        $row['template_data'] = !empty($row['template_data_json']) ? json_decode($row['template_data_json'], true) : null;
        $row['pdf_template'] = $row['pdf_template'] ?? 'standard';
        unset($row['images_json'], $row['spec_table_json'], $row['template_data_json']);

        $fStmt = $this->db->prepare('
            SELECT f.id, f.name, f.slug, f.code, f.swatch_hex, f.swatch_gradient
            FROM finishes f
            INNER JOIN item_finishes ifin ON ifin.finish_id = f.id
            WHERE ifin.item_id = ?
            ORDER BY f.sort_order ASC, f.name ASC
        ');
        $fStmt->execute([$row['id']]);
        $row['finishes'] = $fStmt->fetchAll();
        $row['finish_ids'] = array_map(fn($f) => (int)$f['id'], $row['finishes']);

        $gStmt = $this->db->prepare('
            SELECT g.id, g.title, g.page_code, g.chapter_number, g.page_number
            FROM catalogue_groups g
            INNER JOIN catalogue_group_items gi ON gi.group_id = g.id
            WHERE gi.item_id = ?
            ORDER BY g.page_code ASC
        ');
        $gStmt->execute([$row['id']]);
        $row['groups'] = $gStmt->fetchAll();
        $row['group_ids'] = array_map(fn($g) => (int)$g['id'], $row['groups']);

        return $row;
    }

    private function ensureUniqueSlug(string $slug, ?int $ignoreId = null): string
    {
        $base = $slug;
        $i = 1;
        while (true) {
            $sql = $ignoreId
                ? 'SELECT id FROM items WHERE slug = ? AND id != ? LIMIT 1'
                : 'SELECT id FROM items WHERE slug = ? LIMIT 1';
            $stmt = $this->db->prepare($sql);
            $stmt->execute($ignoreId ? [$slug, $ignoreId] : [$slug]);
            if (!$stmt->fetch()) {
                return $slug;
            }
            $slug = $base . '-' . (++$i);
        }
    }
}
