<?php

class AuthController extends Controller
{
    public function login(): void
    {
        $input = $this->getJsonInput();
        $email = trim($input['email'] ?? '');
        $password = (string)($input['password'] ?? '');

        if (!$email || !$password) {
            $this->error('Email and password are required', 422);
        }

        $model = new AdminModel();
        $admin = $model->findByEmail($email);

        if (!$admin || !password_verify($password, $admin['password_hash'])) {
            $this->error('Invalid email or password', 401);
        }

        $token = Auth::generateToken([
            'sub'   => (int)$admin['id'],
            'email' => $admin['email'],
            'name'  => $admin['name'],
            'role'  => $admin['role'],
        ]);

        $this->success([
            'token' => $token,
            'admin' => [
                'id'    => (int)$admin['id'],
                'name'  => $admin['name'],
                'email' => $admin['email'],
                'role'  => $admin['role'],
            ],
        ], 'Login successful');
    }

    public function me(): void
    {
        $payload = $this->requireAuth();
        $model = new AdminModel();
        $admin = $model->findById((int)$payload['sub']);
        if (!$admin) {
            $this->error('Admin user not found', 404);
        }
        $this->success($admin);
    }

    public function changePassword(): void
    {
        $payload = $this->requireAuth();
        $input = $this->getJsonInput();
        $current = (string)($input['current_password'] ?? '');
        $newPass = (string)($input['new_password'] ?? '');

        if (strlen($newPass) < 6) {
            $this->error('New password must be at least 6 characters', 422);
        }

        $model = new AdminModel();
        $admin = $model->findByEmail($payload['email']);
        if (!$admin || !password_verify($current, $admin['password_hash'])) {
            $this->error('Current password is incorrect', 403);
        }

        $model->updatePassword((int)$admin['id'], $newPass);
        $this->success(null, 'Password updated successfully');
    }
}
