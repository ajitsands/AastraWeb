<?php
/**
 * Generates database/seed.sql with real AASTRA Architectural Hardware data
 * extracted from the Astra brochure PDFs (Door Stops, Door Viewers, Flush Pulls, etc.)
 * and can also seed MySQL directly when run with --run.
 */

$adminHash = password_hash('Aastra@2026', PASSWORD_BCRYPT);

function sqlStr(?string $val): string {
    if ($val === null) return 'NULL';
    return "'" . str_replace(["\\", "'", "\r", "\n"], ["\\\\", "''", "\\r", "\\n"], $val) . "'";
}

function sqlJson($arr): string {
    return sqlStr(json_encode($arr, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
}

// Helper to build a merged-cell specification table cleanly
// Cell format: ['text' => '', 'rowSpan' => 1, 'colSpan' => 1, 'hidden' => false, 'isHeader' => false, 'align' => 'center']
function makeCell(string $text, int $rowSpan = 1, int $colSpan = 1, bool $isHeader = false, bool $hidden = false, string $align = 'center'): array {
    return [
        'text'     => $text,
        'rowSpan'  => $rowSpan,
        'colSpan'  => $colSpan,
        'isHeader' => $isHeader,
        'hidden'   => $hidden,
        'align'    => $align,
    ];
}

function makeMaterialFinishesTable(string $material, array $finishes, array $codes): array {
    $colCount = count($finishes) + 1;
    // Row 0: Material (rowSpan 2) | Finishes (colSpan N)
    $row0 = [makeCell('Material', 2, 1, true)];
    $row0[] = makeCell('Finishes', 1, count($finishes), true);
    for ($i = 1; $i < count($finishes); $i++) {
        $row0[] = makeCell('', 1, 1, true, true);
    }
    // Row 1: hidden under Material | individual finish names
    $row1 = [makeCell('', 1, 1, true, true)];
    foreach ($finishes as $f) {
        $row1[] = makeCell($f, 1, 1, true);
    }
    // Row 2: Material value | catalogue codes
    $row2 = [makeCell($material, 1, 1, false)];
    foreach ($codes as $c) {
        $row2[] = makeCell($c, 1, 1, false);
    }
    return [
        'rows'  => 3,
        'cols'  => $colCount,
        'cells' => [$row0, $row1, $row2],
    ];
}

function makeDimensionFinishesTable(array $dimHeaders, array $finishes, array $dataRows): array {
    $dCount = count($dimHeaders);
    $fCount = count($finishes);
    $colCount = $dCount + $fCount;

    // Row 0: Dimension-mm (colSpan dCount) | Finishes (colSpan fCount)
    $row0 = [makeCell('Dimension-mm', 1, $dCount, true)];
    for ($i = 1; $i < $dCount; $i++) $row0[] = makeCell('', 1, 1, true, true);
    $row0[] = makeCell('Finishes', 1, $fCount, true);
    for ($i = 1; $i < $fCount; $i++) $row0[] = makeCell('', 1, 1, true, true);

    // Row 1: A | B | Finish names...
    $row1 = [];
    foreach ($dimHeaders as $dh) $row1[] = makeCell($dh, 1, 1, true);
    foreach ($finishes as $f) $row1[] = makeCell($f, 1, 1, true);

    $cells = [$row0, $row1];
    foreach ($dataRows as $r) {
        $row = [];
        foreach ($r as $val) {
            $row[] = makeCell($val, 1, 1, false);
        }
        $cells[] = $row;
    }

    return [
        'rows'  => count($cells),
        'cols'  => $colCount,
        'cells' => $cells,
    ];
}

function makeCompactTable(array $headers, array $dataRows): array {
    $cells = [];
    $hRow = [];
    foreach ($headers as $h) $hRow[] = makeCell($h, 1, 1, true);
    $cells[] = $hRow;
    foreach ($dataRows as $r) {
        $row = [];
        foreach ($r as $v) $row[] = makeCell($v, 1, 1, false);
        $cells[] = $row;
    }
    return [
        'rows'  => count($cells),
        'cols'  => count($headers),
        'cells' => $cells,
    ];
}

$sql = [];
$sql[] = "-- AASTRA Architectural Hardware — Pre-Seeded Sample Data";
$sql[] = "SET NAMES utf8mb4;";
$sql[] = "SET FOREIGN_KEY_CHECKS = 0;";
$sql[] = "";

// 1. Default Admin
$sql[] = "-- Default Admin Account (admin@aastra.uk / Aastra@2026)";
$sql[] = "INSERT INTO `admins` (`id`, `name`, `email`, `password_hash`, `role`) VALUES";
$sql[] = "  (1, 'AASTRA Administrator', 'admin@aastra.uk', " . sqlStr($adminHash) . ", 'admin')";
$sql[] = "ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);";
$sql[] = "";

// 2. Categories (Inspired by Simply Door Handles structure + AASTRA Chapter numbering)
$categories = [
    [1, 'Door Handles on Rose', 'door-handles-on-rose', 'HANDLES', 'DOOR HARDWARE', 1, 'Architectural lever handles mounted on concealed-fix round and square roses, engineered in SS304 and solid brass for commercial and luxury residential doors.', '/samples/arh201_photo.png', 1],
    [2, 'Door Handles on Backplate', 'door-handles-on-backplate', 'HANDLES', 'DOOR HARDWARE', 2, 'Classic and contemporary lever handles on latch, lock, euro-profile, and bathroom backplates.', '/samples/arh202_photo.png', 2],
    [3, 'Pull Handles', 'pull-handles', 'HANDLES', 'DOOR HARDWARE', 4, 'Heavy-duty tubular, mitred, and back-to-back architectural entrance pull handles for timber, aluminium, and glass doors.', '/samples/arh204_photo.png', 3],
    [4, 'Flush Pulls', 'flush-pulls', 'HANDLES', 'DOOR HARDWARE', 5, 'Concealed-fixing circular, square, and rectangular recessed flush pulls in SS304 grade stainless steel for sliding and pocket doors.', '/samples/arh201_photo.png', 4],
    [5, 'Door Hinges & Pivots', 'door-hinges', 'HINGES', 'DOOR HARDWARE', 6, 'Grade 13 ball-bearing butt hinges, 3D concealed hinges, and heavy-duty architectural pivots.', '/samples/aae683_photo.png', 5],
    [6, 'Door Locks & Latches', 'door-locks-latches', 'LOCKS', 'DOOR HARDWARE', 7, 'CE-certified architectural mortice sashlocks, deadlocks, tubular latches, and euro cylinders.', '/samples/aae825_photo.png', 6],
    [7, 'Door Stops', 'door-stops', 'ACCESSORIES', 'DOOR HARDWARE', 8, 'Floor-mounted half-dome, cove, magnetic, and wall-mounted architectural door stops crafted from SS304 stainless steel and solid zinc alloy.', '/samples/aae671_photo.png', 7],
    [8, 'Door Viewers', 'door-viewers', 'ACCESSORIES', 'DOOR HARDWARE', 8, 'Wide-angle 180-degree optical brass door eye viewers with privacy covers and extension barrels for fire and entrance doors.', '/samples/aae825_photo.png', 8],
];

$sql[] = "-- Categories";
$sql[] = "INSERT INTO `categories` (`id`, `name`, `slug`, `section_label`, `side_tab_label`, `chapter_number`, `description`, `image_url`, `sort_order`, `is_active`) VALUES";
$catRows = [];
foreach ($categories as $c) {
    $catRows[] = sprintf(
        "  (%d, %s, %s, %s, %s, %d, %s, %s, %d, 1)",
        $c[0], sqlStr($c[1]), sqlStr($c[2]), sqlStr($c[3]), sqlStr($c[4]), $c[5], sqlStr($c[6]), sqlStr($c[7]), $c[8]
    );
}
$sql[] = implode(",\n", $catRows) . "\nON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `description` = VALUES(`description`);";
$sql[] = "";

// 3. Finishes
$finishes = [
    [1, 'Satin SS', 'satin-ss', 'SSS', '#C4C6C8', 'linear-gradient(135deg, #D9DBDD 0%, #AEB1B5 50%, #CFD1D3 100%)', 'Brushed Satin Stainless Steel (SS304/SS316) offering superior corrosion resistance and a refined matte architectural sheen.', 1],
    [2, 'Polished SS', 'polished-ss', 'PSS', '#E2E4E6', 'linear-gradient(135deg, #FFFFFF 0%, #C7CACD 45%, #F0F2F4 100%)', 'Mirror-polished Stainless Steel for crisp, bright contemporary architectural interiors.', 2],
    [3, 'Ant. Brass', 'antique-brass', 'AB', '#8F7347', 'linear-gradient(135deg, #A98B5B 0%, #6D5430 55%, #8C7044 100%)', 'Warm hand-relieved Antique Brass finish bringing heritage character to classic and boutique spaces.', 3],
    [4, 'Polish Brass', 'polished-brass', 'PB', '#D4AF37', 'linear-gradient(135deg, #F3D97E 0%, #C59B27 50%, #E7C85B 100%)', 'Lustrous mirror-finished Polished Brass engineered with protective lacquered or PVD coating.', 4],
    [5, 'Satin Brass', 'satin-brass', 'SB', '#C8A951', 'linear-gradient(135deg, #DEC372 0%, #B3923C 55%, #D2B55E 100%)', 'Softly brushed Satin Brass delivering understated luxury and fingerprint-resistant warmth.', 5],
    [6, 'Black Matt', 'black-matt', 'MB', '#1E1E1E', 'linear-gradient(135deg, #343434 0%, #141414 55%, #272727 100%)', 'Deep architectural Matt Black powder-coated / PVD finish for bold monochromatic contrast.', 6],
    [7, 'Satin Nickel', 'satin-nickel', 'SN', '#B5B0A6', 'linear-gradient(135deg, #CFCAC0 0%, #9E988D 55%, #C0BBB1 100%)', 'Warm brushed Satin Nickel tone pairing seamlessly with neutral stone, oak, and bespoke joinery.', 7],
    [8, 'Polish Chrome', 'polished-chrome', 'PC', '#D6DCE0', 'linear-gradient(135deg, #F7FAFC 0%, #B7C0C7 48%, #E5EBEF 100%)', 'High-gloss Polished Chrome plated over solid brass for timeless crisp reflectivity.', 8],
];

$sql[] = "-- Finishes";
$sql[] = "INSERT INTO `finishes` (`id`, `name`, `slug`, `code`, `swatch_hex`, `swatch_gradient`, `description`, `sort_order`, `is_active`) VALUES";
$finRows = [];
foreach ($finishes as $f) {
    $finRows[] = sprintf(
        "  (%d, %s, %s, %s, %s, %s, %s, %d, 1)",
        $f[0], sqlStr($f[1]), sqlStr($f[2]), sqlStr($f[3]), sqlStr($f[4]), sqlStr($f[5]), sqlStr($f[6]), $f[7]
    );
}
$sql[] = implode(",\n", $finRows) . "\nON DUPLICATE KEY UPDATE `name` = VALUES(`name`);";
$sql[] = "";

// 4. Items (Exact data from Astra PDFs!)
$stdFinishesSS = ['Satin SS', 'Polished SS', 'Ant. Brass', 'Polish Brass', 'Satin Brass', 'Black Matt'];
$stdFinishesBrass = ['Satin Nickel', 'Polish Chrome', 'Ant. Brass', 'Polish Brass', 'Satin Brass', 'Black Matt'];

$items = [
    [
        'id' => 1, 'category_id' => 7, 'name' => 'Floor Mounted Half Dome Door Stop', 'slug' => 'aae-671-half-dome-door-stop',
        'code' => 'AAE.671', 'subtitle' => 'SS304 Half Dome Floor Door Stop with Locating Pin',
        'specifications' => "Floor mounted half dome door stop\nStainless steel SS304 grade\n43mm diameter\nWith locating pin\nSupplied with suitable screws and fixings",
        'material' => 'Stainless Steel', 'is_featured' => 1, 'sort_order' => 1,
        'images' => [
            ['url' => '/samples/aae671_photo.png', 'caption' => 'Product View', 'type' => 'photo'],
            ['url' => '/samples/aae671_drawing.png', 'caption' => 'Technical Drawing (mm)', 'type' => 'drawing'],
        ],
        'spec_table' => makeMaterialFinishesTable('Stainless Steel', $stdFinishesSS, ['677.01.101', '677.01.111', '677.01.121', '677.01.131', '677.01.141', '677.01.151']),
        'finishes' => [1, 2, 3, 4, 5, 6],
    ],
    [
        'id' => 2, 'category_id' => 7, 'name' => 'Floor Mounted Cove Door Stop', 'slug' => 'aae-672-cove-door-stop',
        'code' => 'AAE.672', 'subtitle' => 'Low-Profile 16mm Cove Floor Door Stop',
        'specifications' => "Floor-mounted cove door stop\nStainless steel SS304 grade\n16mm height\n56.5 x 47mm overall size\nSupplied with suitable screws and fixings",
        'material' => 'Stainless Steel', 'is_featured' => 1, 'sort_order' => 2,
        'images' => [
            ['url' => '/samples/aae672_photo.png', 'caption' => 'Product View', 'type' => 'photo'],
            ['url' => '/samples/aae672_drawing.png', 'caption' => 'Technical Drawing (mm)', 'type' => 'drawing'],
        ],
        'spec_table' => makeMaterialFinishesTable('Stainless Steel', $stdFinishesSS, ['677.01.102', '677.01.112', '677.01.122', '677.01.132', '677.01.142', '677.01.152']),
        'finishes' => [1, 2, 3, 4, 5, 6],
    ],
    [
        'id' => 3, 'category_id' => 7, 'name' => 'Wall Mounted Heavy Buffer Door Stop', 'slug' => 'aae-683-wall-mounted-door-stop',
        'code' => 'AAE.683', 'subtitle' => '60mm Diameter Wall Mounted SS304 Door Stop',
        'specifications' => "Wall mounted door stop\nStainless steel SS304 grade\n60mm diameter, 26mm projection\nHeavy-duty EPDM rubber buffer",
        'material' => 'Stainless Steel', 'is_featured' => 0, 'sort_order' => 3,
        'images' => [
            ['url' => '/samples/aae683_photo.png', 'caption' => 'Product View', 'type' => 'photo'],
            ['url' => '/samples/aae683_drawing.png', 'caption' => 'Technical Drawing (mm)', 'type' => 'drawing'],
        ],
        'spec_table' => makeCompactTable(['Material', 'Finishes', 'Cat. No'], [
            ['Stainless Steel', 'Satin SS', '677.01.403'],
            ['Stainless Steel', 'Black Matt', '677.01.453'],
        ]),
        'finishes' => [1, 6],
    ],
    [
        'id' => 4, 'category_id' => 7, 'name' => 'Wall Mounted Dome Buffer Door Stop', 'slug' => 'aae-684-wall-dome-door-stop',
        'code' => 'AAE.684', 'subtitle' => '60mm Concealed-Fix Wall Buffer Stop',
        'specifications' => "Wall mounted door stop\nStainless steel SS304 grade\n60mm diameter domed cushion\nConcealed wall fixing rose",
        'material' => 'Stainless Steel', 'is_featured' => 0, 'sort_order' => 4,
        'images' => [
            ['url' => '/samples/aae684_photo.png', 'caption' => 'Product View', 'type' => 'photo'],
            ['url' => '/samples/aae684_drawing.png', 'caption' => 'Technical Drawing (mm)', 'type' => 'drawing'],
        ],
        'spec_table' => makeCompactTable(['Material', 'Finishes', 'Cat. No'], [
            ['Stainless Steel', 'Satin SS', '677.01.404'],
            ['Stainless Steel', 'Black Matt', '677.01.454'],
        ]),
        'finishes' => [1, 6],
    ],
    [
        'id' => 5, 'category_id' => 8, 'name' => '180° Door Eye Viewer with Privacy Cover', 'slug' => 'aae-825-door-eye-viewer-cover',
        'code' => 'AAE.825', 'subtitle' => 'Solid Brass 14mm Barrel Optical Door Viewer with Cover',
        'specifications' => "Door eye viewer with cover\n14mm dia suitable for 35-55mm door thickness\n180-degree angle of vision\nDim A - 35-55mm, Dim B - 14mm",
        'material' => 'Brass', 'is_featured' => 1, 'sort_order' => 1,
        'images' => [
            ['url' => '/samples/aae825_photo.png', 'caption' => 'Product View', 'type' => 'photo'],
            ['url' => '/samples/aae825_drawing.png', 'caption' => 'Technical Drawing (mm)', 'type' => 'drawing'],
        ],
        'spec_table' => makeMaterialFinishesTable('Brass', $stdFinishesBrass, ['675.01.101', '675.01.111', '675.01.121', '675.01.131', '675.01.141', '675.01.151']),
        'finishes' => [7, 8, 3, 4, 5, 6],
    ],
    [
        'id' => 6, 'category_id' => 8, 'name' => '180° Door Eye Viewer without Cover', 'slug' => 'aae-826-door-eye-viewer',
        'code' => 'AAE.826', 'subtitle' => 'Solid Brass 14mm Barrel Optical Door Viewer',
        'specifications' => "Door eye viewer without cover\n14mm dia suitable for 35-55mm door thickness\n180-degree angle of vision\nDim A - 35-55mm, Dim B - 14mm",
        'material' => 'Brass', 'is_featured' => 0, 'sort_order' => 2,
        'images' => [
            ['url' => '/samples/aae826_photo.png', 'caption' => 'Product View', 'type' => 'photo'],
            ['url' => '/samples/aae826_drawing.png', 'caption' => 'Technical Drawing (mm)', 'type' => 'drawing'],
        ],
        'spec_table' => makeMaterialFinishesTable('Brass', $stdFinishesBrass, ['675.01.102', '675.01.112', '675.01.122', '675.01.132', '675.01.142', '675.01.152']),
        'finishes' => [7, 8, 3, 4, 5, 6],
    ],
    [
        'id' => 7, 'category_id' => 8, 'name' => 'Door Viewer Extension Piece (14mm)', 'slug' => 'aae-835-viewer-extension',
        'code' => 'AAE.835', 'subtitle' => 'Solid Brass Threaded Extension Piece for Thick Doors',
        'specifications' => "Door viewer extension piece for 14mm dia\nSolid machined brass barrel\nAdds 10mm door thickness compatibility",
        'material' => 'Brass', 'is_featured' => 0, 'sort_order' => 3,
        'images' => [
            ['url' => '/samples/aae835_photo.png', 'caption' => 'Product View', 'type' => 'photo'],
            ['url' => '/samples/aae835_drawing.png', 'caption' => 'Technical Drawing (mm)', 'type' => 'drawing'],
        ],
        'spec_table' => makeCompactTable(['Material', 'Cat. No'], [['Material - Brass', '675.01.198']]),
        'finishes' => [4],
    ],
    [
        'id' => 8, 'category_id' => 4, 'name' => 'Round Concealed Fixing Flush Pull', 'slug' => 'arh-201-round-flush-pull',
        'code' => 'ARH.201', 'subtitle' => 'Circular Recessed Sliding Door Flush Pull (50 / 70 / 90mm)',
        'specifications' => "Concealed fixing flush pulls\nStainless steel SS304 grade\nSupplied with suitable screws and fixings",
        'material' => 'Stainless Steel', 'is_featured' => 1, 'sort_order' => 1,
        'images' => [
            ['url' => '/samples/arh201_photo.png', 'caption' => 'Product View', 'type' => 'photo'],
            ['url' => '/samples/arh201_drawing.png', 'caption' => 'Technical Drawing (mm)', 'type' => 'drawing'],
        ],
        'spec_table' => makeDimensionFinishesTable(['A', 'B'], $stdFinishesSS, [
            ['50', '30', '650.01.101', '650.01.111', '650.01.121', '650.01.131', '650.01.141', '650.01.151'],
            ['70', '50', '650.01.102', '650.01.112', '650.01.122', '650.01.132', '650.01.142', '650.01.152'],
            ['90', '70', '650.01.103', '650.01.113', '650.01.123', '650.01.133', '650.01.143', '650.01.153'],
        ]),
        'finishes' => [1, 2, 3, 4, 5, 6],
    ],
    [
        'id' => 9, 'category_id' => 4, 'name' => 'Square Concealed Fixing Flush Pull', 'slug' => 'arh-202-square-flush-pull',
        'code' => 'ARH.202', 'subtitle' => 'Square Recessed Sliding Door Flush Pull (50 / 60 / 70mm)',
        'specifications' => "Concealed fixing flush pulls\nStainless steel SS304 grade\nSupplied with suitable screws and fixings",
        'material' => 'Stainless Steel', 'is_featured' => 1, 'sort_order' => 2,
        'images' => [
            ['url' => '/samples/arh202_photo.png', 'caption' => 'Product View', 'type' => 'photo'],
            ['url' => '/samples/arh202_drawing.png', 'caption' => 'Technical Drawing (mm)', 'type' => 'drawing'],
        ],
        'spec_table' => makeDimensionFinishesTable(['A', 'B'], $stdFinishesSS, [
            ['50', '30', '650.01.201', '650.01.211', '650.01.221', '650.01.231', '650.01.241', '650.01.251'],
            ['60', '40', '650.01.202', '650.01.212', '650.01.222', '650.01.232', '650.01.242', '650.01.252'],
            ['70', '50', '650.01.203', '650.01.213', '650.01.223', '650.01.233', '650.01.243', '650.01.253'],
        ]),
        'finishes' => [1, 2, 3, 4, 5, 6],
    ],
    [
        'id' => 10, 'category_id' => 4, 'name' => 'Rectangular Flush Pull (Square Corner)', 'slug' => 'arh-204-rectangular-flush-pull',
        'code' => 'ARH.204', 'subtitle' => 'Architectural Rectangular Recessed Pull (102 / 125 / 150mm)',
        'specifications' => "Concealed fixing flush pulls\nStainless steel SS304 grade\nSupplied with suitable screws and fixings",
        'material' => 'Stainless Steel', 'is_featured' => 1, 'sort_order' => 3,
        'images' => [
            ['url' => '/samples/arh204_photo.png', 'caption' => 'Product View', 'type' => 'photo'],
            ['url' => '/samples/arh204_drawing.png', 'caption' => 'Technical Drawing (mm)', 'type' => 'drawing'],
        ],
        'spec_table' => makeDimensionFinishesTable(['A', 'B'], $stdFinishesSS, [
            ['102', '50', '650.01.401', '650.01.411', '650.01.421', '650.01.431', '650.01.441', '650.01.451'],
            ['125', '50', '650.01.402', '650.01.412', '650.01.422', '650.01.432', '650.01.442', '650.01.452'],
            ['150', '50', '650.01.403', '650.01.413', '650.01.423', '650.01.433', '650.01.443', '650.01.453'],
        ]),
        'finishes' => [1, 2, 3, 4, 5, 6],
    ],
    [
        'id' => 11, 'category_id' => 4, 'name' => 'Radius Corner Flush Pull', 'slug' => 'arh-206-radius-flush-pull',
        'code' => 'ARH.206', 'subtitle' => 'Soft-Radius Architectural Recessed Flush Pull (115 x 42mm)',
        'specifications' => "Concealed fixing flush pulls\nStainless steel SS304 grade\nSupplied with suitable screws and fixings",
        'material' => 'Stainless Steel', 'is_featured' => 0, 'sort_order' => 4,
        'images' => [
            ['url' => '/samples/arh206_photo.png', 'caption' => 'Product View', 'type' => 'photo'],
            ['url' => '/samples/arh206_drawing.png', 'caption' => 'Technical Drawing (mm)', 'type' => 'drawing'],
        ],
        'spec_table' => makeDimensionFinishesTable(['A', 'B'], $stdFinishesSS, [
            ['115', '42', '650.01.601', '650.01.611', '650.01.621', '650.01.631', '650.01.641', '650.01.651'],
        ]),
        'finishes' => [1, 2, 3, 4, 5, 6],
    ],
];

$sql[] = "-- Items";
$sql[] = "INSERT INTO `items` (`id`, `category_id`, `name`, `slug`, `code`, `subtitle`, `specifications`, `footnote`, `material`, `images_json`, `spec_table_json`, `is_featured`, `is_active`, `sort_order`) VALUES";
$itemRows = [];
foreach ($items as $it) {
    $itemRows[] = sprintf(
        "  (%d, %d, %s, %s, %s, %s, %s, %s, %s, %s, %s, %d, 1, %d)",
        $it['id'], $it['category_id'], sqlStr($it['name']), sqlStr($it['slug']), sqlStr($it['code']),
        sqlStr($it['subtitle']), sqlStr($it['specifications']),
        sqlStr('"Special finishes & sizes available upon request subject to minimum order quantity"'),
        sqlStr($it['material']), sqlJson($it['images']), sqlJson($it['spec_table']),
        $it['is_featured'], $it['sort_order']
    );
}
$sql[] = implode(",\n", $itemRows) . "\nON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `spec_table_json` = VALUES(`spec_table_json`);";
$sql[] = "";

// Item Finishes
$sql[] = "-- Item Finishes";
$ifRows = [];
foreach ($items as $it) {
    foreach ($it['finishes'] as $fid) {
        $ifRows[] = sprintf("  (%d, %d)", $it['id'], $fid);
    }
}
$sql[] = "INSERT IGNORE INTO `item_finishes` (`item_id`, `finish_id`) VALUES\n" . implode(",\n", $ifRows) . ";";
$sql[] = "";

// 5. Catalogue PDF Page Groups
$groups = [
    [1, 4, 'Round & Square Flush Pulls', 'AH', '5', '201', 'AH.5.201', 'HANDLES', 'FLUSH PULLS', 'DOOR HARDWARE', 'standard', [8, 9]],
    [2, 4, 'Rectangular & Radius Flush Pulls', 'AH', '5', '203', 'AH.5.203', 'HANDLES', 'FLUSH PULLS', 'DOOR HARDWARE', 'standard', [10, 11]],
    [3, 8, '180° Door Eye Viewers & Extension', 'AH', '8', '03', 'AH.8.03', 'ACCESSORIES', 'DOOR VIEWER', 'DOOR HARDWARE', 'standard', [5, 6, 7]],
    [4, 7, 'Floor Mounted Door Stops', 'AH', '8', '06', 'AH.8.06', 'ACCESSORIES', 'DOOR STOPS', 'DOOR HARDWARE', 'standard', [1, 2]],
    [5, 7, 'Wall Mounted Door Stops', 'AH', '8', '11', 'AH.8.11', 'ACCESSORIES', 'DOOR STOPS', 'DOOR HARDWARE', 'compact', [3, 4]],
];

$sql[] = "-- Catalogue PDF Page Groups";
$sql[] = "INSERT INTO `catalogue_groups` (`id`, `category_id`, `title`, `prefix`, `chapter_number`, `page_number`, `page_code`, `section_label`, `category_badge`, `side_tab_label`, `layout_mode`, `show_guarantee_seal`, `footer_website`, `is_active`) VALUES";
$gRows = [];
foreach ($groups as $g) {
    $gRows[] = sprintf(
        "  (%d, %d, %s, %s, %s, %s, %s, %s, %s, %s, %s, 1, 'www.aastra.uk', 1)",
        $g[0], $g[1], sqlStr($g[2]), sqlStr($g[3]), sqlStr($g[4]), sqlStr($g[5]), sqlStr($g[6]),
        sqlStr($g[7]), sqlStr($g[8]), sqlStr($g[9]), sqlStr($g[10])
    );
}
$sql[] = implode(",\n", $gRows) . "\nON DUPLICATE KEY UPDATE `title` = VALUES(`title`);";
$sql[] = "";

$sql[] = "-- Catalogue Group Items";
$giRows = [];
foreach ($groups as $g) {
    $ord = 0;
    foreach ($g[11] as $itemId) {
        $giRows[] = sprintf("  (%d, %d, %d)", $g[0], $itemId, $ord++);
    }
}
$sql[] = "INSERT IGNORE INTO `catalogue_group_items` (`group_id`, `item_id`, `sort_order`) VALUES\n" . implode(",\n", $giRows) . ";";
$sql[] = "";
$sql[] = "SET FOREIGN_KEY_CHECKS = 1;";

$outputSql = implode("\n", $sql) . "\n";
file_put_contents(__DIR__ . '/seed.sql', $outputSql);
echo "Generated database/seed.sql (" . strlen($outputSql) . " bytes)\n";
