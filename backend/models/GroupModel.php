<?php

class GroupModel extends Model
{
    public function getAll(array $filters = []): array
    {
        $conditions = [];
        $params = [];

        if (!empty($filters['only_active'])) {
            $conditions[] = 'g.is_active = 1';
        }
        if (!empty($filters['category_id'])) {
            $conditions[] = 'g.category_id = ?';
            $params[] = (int)$filters['category_id'];
        }
        if (!empty($filters['category_slug'])) {
            $conditions[] = 'c.slug = ?';
            $params[] = $filters['category_slug'];
        }

        $where = $conditions ? 'WHERE ' . implode(' AND ', $conditions) : '';
        $sql = "
            SELECT g.*, c.name AS category_name, c.slug AS category_slug
            FROM catalogue_groups g
            INNER JOIN categories c ON c.id = g.category_id
            $where
            ORDER BY CAST(g.chapter_number AS UNSIGNED) ASC, g.page_number ASC, g.id ASC
        ";
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        $groups = $stmt->fetchAll();

        $itemModel = new ItemModel();
        foreach ($groups as &$group) {
            $group['items'] = $this->getGroupItems((int)$group['id'], $itemModel);
            $group['item_ids'] = array_map(fn($i) => (int)$i['id'], $group['items']);
        }
        return $groups;
    }

    public function findByIdOrCode($identifier): ?array
    {
        $sql = "
            SELECT g.*, c.name AS category_name, c.slug AS category_slug
            FROM catalogue_groups g
            INNER JOIN categories c ON c.id = g.category_id
            WHERE " . (is_numeric($identifier) ? 'g.id = ?' : 'g.page_code = ?') . "
            LIMIT 1
        ";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([is_numeric($identifier) ? (int)$identifier : $identifier]);
        $group = $stmt->fetch();
        if (!$group) {
            return null;
        }
        $itemModel = new ItemModel();
        $group['items'] = $this->getGroupItems((int)$group['id'], $itemModel);
        $group['item_ids'] = array_map(fn($i) => (int)$i['id'], $group['items']);
        return $group;
    }

    public function create(array $data): array
    {
        $prefix = strtoupper(trim($data['prefix'] ?? 'AH'));
        $chapter = trim((string)($data['chapter_number'] ?? '8'));
        $page = trim((string)($data['page_number'] ?? '01'));
        $pageCode = !empty($data['page_code']) ? trim($data['page_code']) : "$prefix.$chapter.$page";

        $stmt = $this->db->prepare('
            INSERT INTO catalogue_groups
                (category_id, title, prefix, chapter_number, page_number, page_code,
                 section_label, category_badge, side_tab_label, layout_mode,
                 show_guarantee_seal, footer_website, notes, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ');
        $stmt->execute([
            (int)$data['category_id'],
            trim($data['title']),
            $prefix,
            $chapter,
            $page,
            $pageCode,
            strtoupper(trim($data['section_label'] ?? 'ACCESSORIES')),
            strtoupper(trim($data['category_badge'] ?? $data['title'])),
            strtoupper(trim($data['side_tab_label'] ?? 'DOOR HARDWARE')),
            in_array($data['layout_mode'] ?? 'standard', ['standard', 'compact']) ? $data['layout_mode'] : 'standard',
            isset($data['show_guarantee_seal']) ? (int)(bool)$data['show_guarantee_seal'] : 1,
            trim($data['footer_website'] ?? 'www.aastra.uk'),
            $data['notes'] ?? null,
            isset($data['is_active']) ? (int)(bool)$data['is_active'] : 1,
        ]);

        $groupId = (int)$this->db->lastInsertId();
        if (isset($data['item_ids']) && is_array($data['item_ids'])) {
            $this->syncItems($groupId, $data['item_ids']);
        }

        return $this->findByIdOrCode($groupId);
    }

    public function update(int $id, array $data): ?array
    {
        $existing = $this->findByIdOrCode($id);
        if (!$existing) {
            return null;
        }

        $prefix = strtoupper(trim($data['prefix'] ?? $existing['prefix']));
        $chapter = trim((string)($data['chapter_number'] ?? $existing['chapter_number']));
        $page = trim((string)($data['page_number'] ?? $existing['page_number']));
        $pageCode = !empty($data['page_code']) ? trim($data['page_code']) : "$prefix.$chapter.$page";

        $stmt = $this->db->prepare('
            UPDATE catalogue_groups
            SET category_id = ?, title = ?, prefix = ?, chapter_number = ?, page_number = ?, page_code = ?,
                section_label = ?, category_badge = ?, side_tab_label = ?, layout_mode = ?,
                show_guarantee_seal = ?, footer_website = ?, notes = ?, is_active = ?
            WHERE id = ?
        ');
        $stmt->execute([
            (int)($data['category_id'] ?? $existing['category_id']),
            isset($data['title']) ? trim($data['title']) : $existing['title'],
            $prefix,
            $chapter,
            $page,
            $pageCode,
            strtoupper(trim($data['section_label'] ?? $existing['section_label'])),
            strtoupper(trim($data['category_badge'] ?? $existing['category_badge'])),
            strtoupper(trim($data['side_tab_label'] ?? $existing['side_tab_label'])),
            in_array($data['layout_mode'] ?? $existing['layout_mode'], ['standard', 'compact'])
                ? ($data['layout_mode'] ?? $existing['layout_mode'])
                : 'standard',
            array_key_exists('show_guarantee_seal', $data) ? (int)(bool)$data['show_guarantee_seal'] : $existing['show_guarantee_seal'],
            trim($data['footer_website'] ?? $existing['footer_website']),
            array_key_exists('notes', $data) ? $data['notes'] : $existing['notes'],
            array_key_exists('is_active', $data) ? (int)(bool)$data['is_active'] : $existing['is_active'],
            $id,
        ]);

        if (isset($data['item_ids']) && is_array($data['item_ids'])) {
            $this->syncItems($id, $data['item_ids']);
        }

        return $this->findByIdOrCode($id);
    }

    public function delete(int $id): bool
    {
        $stmt = $this->db->prepare('DELETE FROM catalogue_groups WHERE id = ?');
        return $stmt->execute([$id]);
    }

    private function syncItems(int $groupId, array $itemIds): void
    {
        $this->db->prepare('DELETE FROM catalogue_group_items WHERE group_id = ?')->execute([$groupId]);
        $stmt = $this->db->prepare('INSERT IGNORE INTO catalogue_group_items (group_id, item_id, sort_order) VALUES (?, ?, ?)');
        $order = 0;
        foreach ($itemIds as $iid) {
            if (is_numeric($iid)) {
                $stmt->execute([$groupId, (int)$iid, $order++]);
            }
        }
    }

    private function getGroupItems(int $groupId, ItemModel $itemModel): array
    {
        $stmt = $this->db->prepare('
            SELECT i.*, c.name AS category_name, c.slug AS category_slug,
                   c.section_label, c.side_tab_label, c.chapter_number,
                   gi.sort_order AS group_sort_order
            FROM catalogue_group_items gi
            INNER JOIN items i ON i.id = gi.item_id
            INNER JOIN categories c ON c.id = i.category_id
            WHERE gi.group_id = ?
            ORDER BY gi.sort_order ASC, i.id ASC
        ');
        $stmt->execute([$groupId]);
        $rows = $stmt->fetchAll();
        return array_map([$itemModel, 'hydrateItem'], $rows);
    }
}
