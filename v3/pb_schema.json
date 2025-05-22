[
  {
    "id": "planners_coll_id_abc123",
    "name": "planners",
    "type": "base",
    "system": false,
    "schema": [
      {"id": "plnr_user_id_xyz", "name": "user", "type": "relation", "system": false, "required": false, "presentable": false, "unique": false, "options": {"collectionId": "_pb_users_auth_", "cascadeDelete": false, "minSelect": null, "maxSelect": 1, "displayFields": []}},
      {"id": "plnr_week_id_fld","name": "week_id","type": "text","system": false,"required": true,"unique": true,"presentable": true,"options": {"min": null,"max": null,"pattern": "^\\d{4}-W(0[1-9]|[1-4][0-9]|5[0-3])$"}},
      {"id": "plnr_date_range_fld","name": "date_range","type": "text","system": false,"required": false,"unique": false,"presentable": false,"options": {"min": null,"max": null,"pattern": ""}},
      {"id": "plnr_title_fld","name": "planner_title","type": "text","system": false,"required": false,"unique": false,"presentable": true,"options": {"min": null,"max": null,"pattern": ""}},
      {"id": "plnr_uicfg_fld","name": "ui_config","type": "json","system": false,"required": false,"unique": false,"presentable": false,"options": {"maxSize":524288}},
      {"id": "plnr_times_fld","name": "times_display","type": "json","system": false,"required": false,"unique": false,"presentable": false,"options": {"maxSize":10240}},
      {"id": "plnr_schedule_fld","name": "schedule_data","type": "json","system": false,"required": false,"unique": false,"presentable": false,"options": {"maxSize":2097152}},
      {"id": "plnr_tasks_fld","name": "tasks_data","type": "json","system": false,"required": false,"unique": false,"presentable": false,"options": {"maxSize":1048576}},
      {"id": "plnr_workout_fld","name": "workout_plan_data","type": "json","system": false,"required": false,"unique": false,"presentable": false,"options": {"maxSize":524288}},
      {"id": "plnr_meals_fld","name": "meals_data","type": "json","system": false,"required": false,"unique": false,"presentable": false,"options": {"maxSize":524288}},
      {"id": "plnr_groc_budget_fld","name": "grocery_budget","type": "text","system": false,"required": false,"unique": false,"presentable": false,"options": {"min": null,"max": null,"pattern": ""}},
      {"id": "plnr_groc_list_fld","name": "grocery_list_data","type": "json","system": false,"required": false,"unique": false,"presentable": false,"options": {"maxSize":524288}},
      {"id": "plnr_bodym_fld","name": "body_measurements_data","type": "json","system": false,"required": false,"unique": false,"presentable": false,"options": {"maxSize":524288}},
      {"id": "plnr_financials_fld","name": "financials_data","type": "json","system": false,"required": false,"unique": false,"presentable": false,"options": {"maxSize":524288}}
    ],
    "indexes": [
      "CREATE UNIQUE INDEX `idx_planners_week_id_user` ON `planners` (`week_id`, `user`) WHERE `user` IS NOT NULL",
      "CREATE UNIQUE INDEX `idx_planners_week_id_nouser` ON `planners` (`week_id`) WHERE `user` IS NULL"
    ],
    "listRule": "@request.auth.id != \"\" && user = @request.auth.id", 
    "viewRule": "@request.auth.id != \"\" && user = @request.auth.id", 
    "createRule": "@request.auth.id != \"\"", 
    "updateRule": "@request.auth.id != \"\" && user = @request.auth.id", 
    "deleteRule": "@request.auth.id != \"\" && user = @request.auth.id", 
    "options": {}
  },
  {
    "id": "appcfg_coll_id_xyz789",
    "name": "app_config",
    "type": "base",
    "system": false,
    "schema": [
      {"id": "acfg_key_fld","name": "config_key","type": "text","system": false,"required": true,"unique": true,"presentable": true,"options": {"min":1,"max":null,"pattern":"default_v[0-9]+"}},
      {"id": "acfg_title_fld","name": "planner_title_default","type": "text","system": false,"required": false,"unique": false,"presentable": false,"options": {"min":null,"max":null,"pattern":""}},
      {"id": "acfg_uicfg_fld","name": "ui_config_default","type": "json","system": false,"required": false,"unique": false,"presentable": false,"options": {"maxSize":524288}},
      {"id": "acfg_times_fld","name": "times_default","type": "json","system": false,"required": false,"unique": false,"presentable": false,"options": {"maxSize":10240}},
      {"id": "acfg_schedule_fld","name": "schedule_default","type": "json","system": false,"required": false,"unique": false,"presentable": false,"options": {"maxSize":2097152}},
      {"id": "acfg_taskcnt_fld","name": "tasks_default_count","type": "number","system": false,"required": false,"unique": false,"presentable": false,"options": {"min":0,"max":100,"noDecimal":true}},
      {"id": "acfg_workout_fld","name": "workout_plan_default","type": "json","system": false,"required": false,"unique": false,"presentable": false,"options": {"maxSize":524288}},
      {"id": "acfg_meals_fld","name": "meals_default","type": "json","system": false,"required": false,"unique": false,"presentable": false,"options": {"maxSize":524288}},
      {"id": "acfg_groc_list_fld","name": "grocery_list_default","type": "json","system": false,"required": false,"unique": false,"presentable": false,"options": {"maxSize":524288}},
      {"id": "acfg_groc_budg_ph_fld","name": "grocery_budget_default_placeholder","type": "text","system": false,"required": false,"unique": false,"presentable": false,"options": {"min":null,"max":null,"pattern":""}},
      {"id": "acfg_bodym_fld","name": "body_measurements_default","type": "json","system": false,"required": false,"unique": false,"presentable": false,"options": {"maxSize":524288}},
      {"id": "acfg_financials_fld","name": "financials_default","type": "json","system": false,"required": false,"unique": false,"presentable": false,"options": {"maxSize":524288}}
    ],
    "indexes": [
      "CREATE UNIQUE INDEX `idx_app_config_key` ON `app_config` (`config_key`)"
    ],
    "listRule": "@request.auth.id != \"\"", 
    "viewRule": "@request.auth.id != \"\"", 
    "createRule": "@request.auth.admin = true", 
    "updateRule": "@request.auth.admin = true", 
    "deleteRule": "@request.auth.admin = true",
    "options": {}
  }
]
