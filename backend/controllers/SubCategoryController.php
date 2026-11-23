<?php

class SubCategoryController extends Controller
{
    public function index(): void
    {
        $filters = [
            'only_active'   => isset($_GET['all']) ? false : true,
            'category_id'   => $_GET['category_id'] ?? null,
            'category_slug' => $_GET['category'] ?? null,
        ];
        $model = new SubCategoryModel();
        $this->success($model->getAll($filters));
    }

    public function show(array $params): void
    {
        $model = new SubCategoryModel();
        $sub = $model->findByIdOrSlug($params['id']);
        if (!$sub) {
            $this->error('Sub category not found', 404);
        }
        $itemModel = new ItemModel();
        $sub['items'] = $itemModel->getAll(['sub_category_id' => $sub['id'], 'only_active' => true]);
        $this->success($sub);
    }

    public function store(): void
    {
        $this->requireAuth();
        $input = $this->getJsonInput();
        if (empty($input['name']) || empty($input['category_id'])) {
            $this->error('Sub category name and main category are required', 422);
        }
        $model = new SubCategoryModel();
        $created = $model->create($input);
        $this->success($created, 'Sub category created', 201);
    }

    public function update(array $params): void
    {
        $this->requireAuth();
        $input = $this->getJsonInput();
        $model = new SubCategoryModel();
        $updated = $model->update((int)$params['id'], $input);
        if (!$updated) {
            $this->error('Sub category not found', 404);
        }
        $this->success($updated, 'Sub category updated');
    }

    public function destroy(array $params): void
    {
        $this->requireAuth();
        $model = new SubCategoryModel();
        $model->delete((int)$params['id']);
        $this->success(null, 'Sub category deleted');
    }
}
