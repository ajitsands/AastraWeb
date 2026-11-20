<?php

class EnquiryModel extends Model
{
    public function getAll(): array
    {
        return $this->db->query('SELECT * FROM enquiries ORDER BY created_at DESC')->fetchAll();
    }

    public function create(array $data): array
    {
        $stmt = $this->db->prepare('
            INSERT INTO enquiries (name, company, email, phone, item_code, subject, message)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ');
        $stmt->execute([
            trim($data['name']),
            $data['company'] ?? null,
            trim($data['email']),
            $data['phone'] ?? null,
            $data['item_code'] ?? null,
            $data['subject'] ?? 'General Hardware Enquiry',
            trim($data['message']),
        ]);

        $id = (int)$this->db->lastInsertId();
        $row = $this->db->prepare('SELECT * FROM enquiries WHERE id = ?');
        $row->execute([$id]);
        return $row->fetch();
    }

    public function updateStatus(int $id, string $status): bool
    {
        if (!in_array($status, ['new', 'reviewed', 'replied'])) {
            return false;
        }
        $stmt = $this->db->prepare('UPDATE enquiries SET status = ? WHERE id = ?');
        return $stmt->execute([$status, $id]);
    }
}
