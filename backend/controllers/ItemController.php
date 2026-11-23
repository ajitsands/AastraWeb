<?php

class ItemController extends Controller
{
    public function index(): void
    {
        $filters = [
            'only_active'       => isset($_GET['all']) ? false : true,
            'category_id'       => $_GET['category_id'] ?? null,
            'category_slug'     => $_GET['category'] ?? null,
            'sub_category_id'   => $_GET['sub_category_id'] ?? null,
            'sub_category_slug' => $_GET['sub_category'] ?? null,
            'finish_id'         => $_GET['finish_id'] ?? null,
            'finish_slug'       => $_GET['finish'] ?? null,
            'featured'          => !empty($_GET['featured']),
            'search'            => $_GET['q'] ?? null,
        ];
        $model = new ItemModel();
        $this->success($model->getAll($filters));
    }

    public function show(array $params): void
    {
        $model = new ItemModel();
        $item = $model->findByIdOrSlug($params['id']);
        if (!$item) {
            $this->error('Item not found', 404);
        }
        $this->success($item);
    }

    public function store(): void
    {
        $this->requireAuth();
        $input = $this->getJsonInput();
        if (empty($input['name']) || empty($input['code']) || empty($input['category_id'])) {
            $this->error('Item name, code, and category are required', 422);
        }
        $model = new ItemModel();
        $created = $model->create($input);
        $this->success($created, 'Item created', 201);
    }

    public function update(array $params): void
    {
        $this->requireAuth();
        $input = $this->getJsonInput();
        $model = new ItemModel();
        $updated = $model->update((int)$params['id'], $input);
        if (!$updated) {
            $this->error('Item not found', 404);
        }
        $this->success($updated, 'Item updated');
    }

    public function destroy(array $params): void
    {
        $this->requireAuth();
        $model = new ItemModel();
        $model->delete((int)$params['id']);
        $this->success(null, 'Item deleted');
    }
}
