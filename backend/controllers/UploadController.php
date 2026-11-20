<?php

class UploadController extends Controller
{
    public function upload(): void
    {
        $this->requireAuth();

        if (empty($_FILES['file'])) {
            $this->error('No file uploaded', 422);
        }

        $file = $_FILES['file'];
        if ($file['error'] !== UPLOAD_ERR_OK) {
            $this->error('Upload error code: ' . $file['error'], 400);
        }

        if ($file['size'] > MAX_UPLOAD_SIZE) {
            $this->error('File exceeds maximum allowed size (8MB)', 422);
        }

        $allowed = [
            'image/jpeg' => 'jpg',
            'image/png'  => 'png',
            'image/webp' => 'webp',
            'image/gif'  => 'gif',
            'image/svg+xml' => 'svg',
        ];

        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mime = finfo_file($finfo, $file['tmp_name']);
        finfo_close($finfo);

        if (!isset($allowed[$mime])) {
            $this->error('Unsupported image format. Allowed: JPG, PNG, WEBP, GIF, SVG', 422);
        }

        if (!is_dir(UPLOAD_DIR)) {
            mkdir(UPLOAD_DIR, 0755, true);
        }

        $ext = $allowed[$mime];
        $filename = 'aastra_' . date('Ymd_His') . '_' . bin2hex(random_bytes(4)) . '.' . $ext;
        $targetPath = UPLOAD_DIR . $filename;

        if (!move_uploaded_file($file['tmp_name'], $targetPath)) {
            $this->error('Failed to save uploaded file', 500);
        }

        $this->success([
            'url'      => '/uploads/' . $filename,
            'filename' => $filename,
            'mime'     => $mime,
            'size'     => $file['size'],
        ], 'File uploaded', 201);
    }
}
