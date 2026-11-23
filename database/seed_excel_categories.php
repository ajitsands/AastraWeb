<?php
/**
 * Seeds all 9 Main Categories & 21 Sub Categories from:
 * "Assets And Documents/Main Category & Sub category.xlsx"
 * Safe & idempotent: upserts Main Categories and Sub Categories without losing existing items!
 *
 * Usage: php database/seed_excel_categories.php
 */

require_once dirname(__DIR__) . '/backend/config/config.php';
require_once dirname(__DIR__) . '/backend/config/Database.php';
require_once dirname(__DIR__) . '/backend/core/Model.php';
require_once dirname(__DIR__) . '/backend/models/SubCategoryModel.php';

$db = Database::getConnection();
(new SubCategoryModel())->ensureSchema();

$taxonomy = [
    [
        'name' => 'Door Hinges', 'slug' => 'door-hinges', 'section_label' => 'HINGES', 'side_tab_label' => 'DOOR HARDWARE', 'chapter_number' => 4,
        'description' => 'Architectural Grade 13 ball-bearing butt hinges and 3D adjustable concealed mortice hinges for flush and rebated doors.',
        'image_url' => '/samples/aae683_photo.png', 'sort_order' => 1,
        'subs' => ['Butt Hinges', 'Concealed Hinges'],
    ],
    [
        'name' => 'Door Closer', 'slug' => 'door-closer', 'section_label' => 'DOOR CLOSERS', 'side_tab_label' => 'DOOR HARDWARE', 'chapter_number' => 5,
        'description' => 'EN 1154 certified overhead, concealed, and parallel-arm hydraulic door closers for fire and smoke control doors.',
        'image_url' => '/samples/aae684_photo.png', 'sort_order' => 2,
        'subs' => ['Overhead Door Closer', 'Concealed Door Closer', 'Parallel Arm Door Closer'],
    ],
    [
        'name' => 'Locking Systems', 'slug' => 'locking-systems', 'section_label' => 'LOCKS', 'side_tab_label' => 'DOOR HARDWARE', 'chapter_number' => 2,
        'description' => 'EN 12209 certified architectural mortice locksets, deadlocks, bathroom/WC locks, and panic exit bars.',
        'image_url' => '/samples/aae825_photo.png', 'sort_order' => 3,
        'subs' => ['Lockset', 'Panic Bar'],
    ],
    [
        'name' => 'Cylinders', 'slug' => 'cylinders', 'section_label' => 'CYLINDERS', 'side_tab_label' => 'DOOR HARDWARE', 'chapter_number' => 3,
        'description' => 'High-security euro-profile double cylinders, single half-cylinders, and WC thumb-turn cylinders.',
        'image_url' => '/samples/aae826_photo.png', 'sort_order' => 4,
        'subs' => ['Double Cylinder', 'Single Cylinder', 'WC Cylinder'],
    ],
    [
        'name' => 'Handles', 'slug' => 'handles', 'section_label' => 'HANDLES', 'side_tab_label' => 'DOOR HARDWARE', 'chapter_number' => 1,
        'description' => 'Precision-crafted lever handles in solid brass & SS304, heavy-duty tubular pull handles, and concealed recessed flush pulls.',
        'image_url' => '/samples/arh201_photo.png', 'sort_order' => 5,
        'subs' => ['Lever Handles', 'Pull Handles', 'Recessed Handle'],
    ],
    [
        'name' => 'Door Sliding Systems', 'slug' => 'door-sliding-systems', 'section_label' => 'SLIDING SYSTEMS', 'side_tab_label' => 'DOOR HARDWARE', 'chapter_number' => 6,
        'description' => 'Smooth architectural concealed and overhead sliding door track systems for timber and glass doors.',
        'image_url' => '/samples/arh204_photo.png', 'sort_order' => 6,
        'subs' => ['Concealed Door Sliding Systems', 'Overhead Door Sliding Systems'],
    ],
    [
        'name' => 'Door Seals', 'slug' => 'door-seals', 'section_label' => 'SEALS', 'side_tab_label' => 'DOOR HARDWARE', 'chapter_number' => 7,
        'description' => 'Acoustic, smoke, and draught-proofing perimeter seals and batwing seals in PVC and TPE.',
        'image_url' => '/samples/arh206_photo.png', 'sort_order' => 7,
        'subs' => ['Perimeter Seal', 'Batwing Seal'],
    ],
    [
        'name' => 'Door Accessories', 'slug' => 'door-accessories', 'section_label' => 'ACCESSORIES', 'side_tab_label' => 'DOOR HARDWARE', 'chapter_number' => 8,
        'description' => 'Architectural 180-degree door eye viewers, floor & wall mounted door stoppers, and security door guards.',
        'image_url' => '/samples/aae671_photo.png', 'sort_order' => 8,
        'subs' => ['Door Eye Viewer', 'Door Stopper', 'Door Guards'],
    ],
    [
        'name' => 'Glass Door Fittings', 'slug' => 'glass-door-fittings', 'section_label' => 'GLASS FITTINGS', 'side_tab_label' => 'DOOR HARDWARE', 'chapter_number' => 9,
        'description' => 'Frameless toughened glass door patch fittings and heavy-duty hydraulic floor springs.',
        'image_url' => '/samples/arh202_photo.png', 'sort_order' => 9,
        'subs' => ['Patch fittings', 'Floor Spring'],
    ],
];

function makeSlug(string $s): string {
    return trim(preg_replace('/[^a-z0-9]+/', '-', strtolower($s)), '-');
}

$catIds = [];
$subIds = [];

foreach ($taxonomy as $cat) {
    $stmt = $db->prepare('SELECT id FROM categories WHERE slug = ? LIMIT 1');
    $stmt->execute([$cat['slug']]);
    $existing = $stmt->fetch();

    if ($existing) {
        $catId = (int)$existing['id'];
        $upd = $db->prepare('UPDATE categories SET name = ?, section_label = ?, side_tab_label = ?, chapter_number = ?, description = ?, sort_order = ?, is_active = 1 WHERE id = ?');
        $upd->execute([$cat['name'], $cat['section_label'], $cat['side_tab_label'], $cat['chapter_number'], $cat['description'], $cat['sort_order'], $catId]);
    } else {
        $ins = $db->prepare('INSERT INTO categories (name, slug, section_label, side_tab_label, chapter_number, description, image_url, sort_order, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)');
        $ins->execute([$cat['name'], $cat['slug'], $cat['section_label'], $cat['side_tab_label'], $cat['chapter_number'], $cat['description'], $cat['image_url'], $cat['sort_order']]);
        $catId = (int)$db->lastInsertId();
    }
    $catIds[$cat['slug']] = $catId;

    $ord = 1;
    foreach ($cat['subs'] as $subName) {
        $subSlug = makeSlug($subName);
        $sStmt = $db->prepare('SELECT id FROM sub_categories WHERE slug = ? LIMIT 1');
        $sStmt->execute([$subSlug]);
        $sEx = $sStmt->fetch();

        if ($sEx) {
            $subId = (int)$sEx['id'];
            $db->prepare('UPDATE sub_categories SET category_id = ?, name = ?, sort_order = ?, is_active = 1 WHERE id = ?')
               ->execute([$catId, $subName, $ord, $subId]);
        } else {
            $db->prepare('INSERT INTO sub_categories (category_id, name, slug, sort_order, is_active) VALUES (?, ?, ?, ?, 1)')
               ->execute([$catId, $subName, $subSlug, $ord]);
            $subId = (int)$db->lastInsertId();
        }
        $subIds[$subSlug] = $subId;
        $ord++;
    }
}

// Re-assign existing sample items & groups into the clean Excel Main -> Sub Category hierarchy!
$reassignMap = [
    // old category slug -> [new main slug, new sub slug]
    'door-stops'   => ['door-accessories', 'door-stopper'],
    'door-viewers' => ['door-accessories', 'door-eye-viewer'],
    'flush-pulls'  => ['handles', 'recessed-handle'],
];

foreach ($reassignMap as $oldSlug => [$newCatSlug, $newSubSlug]) {
    $oldCat = $db->prepare('SELECT id FROM categories WHERE slug = ? LIMIT 1');
    $oldCat->execute([$oldSlug]);
    if ($row = $oldCat->fetch()) {
        $oldId = (int)$row['id'];
        $db->prepare('UPDATE items SET category_id = ?, sub_category_id = ? WHERE category_id = ?')
           ->execute([$catIds[$newCatSlug], $subIds[$newSubSlug], $oldId]);
        $db->prepare('UPDATE catalogue_groups SET category_id = ?, sub_category_id = ? WHERE category_id = ?')
           ->execute([$catIds[$newCatSlug], $subIds[$newSubSlug], $oldId]);
    }
}

// Deactivate old superseded flat categories so the 9 Excel Main Categories shine cleanly
$oldSlugs = ['door-handles-on-rose', 'door-handles-on-backplate', 'pull-handles', 'flush-pulls', 'door-locks-latches', 'door-stops', 'door-viewers'];
$placeholders = implode(',', array_fill(0, count($oldSlugs), '?'));
$db->prepare("UPDATE categories SET is_active = 0 WHERE slug IN ($placeholders)")->execute($oldSlugs);

echo "Seeded 9 Main Categories & 21 Sub Categories from Excel successfully!\n";
