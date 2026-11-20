<?php

class GroupController extends Controller
{
    public function index(): void
    {
        $filters = [
            'only_active'   => isset($_GET['all']) ? false : true,
            'category_id'   => $_GET['category_id'] ?? null,
            'category_slug' => $_GET['category'] ?? null,
        ];
        $model = new GroupModel();
        $this->success($model->getAll($filters));
    }

    public function show(array $params): void
    {
        $model = new GroupModel();
        $group = $model->findByIdOrCode($params['id']);
        if (!$group) {
            $this->error('Catalogue page group not found', 404);
        }
        $this->success($group);
    }

    public function store(): void
    {
        $this->requireAuth();
        $input = $this->getJsonInput();
        if (empty($input['title']) || empty($input['category_id'])) {
            $this->error('Group title and category are required', 422);
        }
        $model = new GroupModel();
        try {
            $created = $model->create($input);
            $this->success($created, 'Catalogue group created', 201);
        } catch (PDOException $e) {
            if (str_contains($e->getMessage(), 'Duplicate')) {
                $this->error('A catalogue page with this page code already exists', 409);
            }
            $this->error('Failed to create group: ' . $e->getMessage(), 500);
        }
    }

    public function update(array $params): void
    {
        $this->requireAuth();
        $input = $this->getJsonInput();
        $model = new GroupModel();
        try {
            $updated = $model->update((int)$params['id'], $input);
            if (!$updated) {
                $this->error('Catalogue group not found', 404);
            }
            $this->success($updated, 'Catalogue group updated');
        } catch (PDOException $e) {
            if (str_contains($e->getMessage(), 'Duplicate')) {
                $this->error('A catalogue page with this page code already exists', 409);
            }
            $this->error('Failed to update group: ' . $e->getMessage(), 500);
        }
    }

    public function destroy(array $params): void
    {
        $this->requireAuth();
        $model = new GroupModel();
        $model->delete((int)$params['id']);
        $this->success(null, 'Catalogue group deleted');
    }
}
