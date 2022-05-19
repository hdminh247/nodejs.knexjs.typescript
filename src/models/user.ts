import { Model } from "objection";
import { Knex } from "knex";

// Models
import File from "./file";

// https://vincit.github.io/objection.js/guide/models.html

class User extends Model {
  id!: number;
  email!: string;
  password!: string;

  static get tableName() {
    return "users";
  }

  static get idColumn() {
    return "id";
  }

  static get modifiers() {
    return {
      defaultSelectWithGraph(builder: Knex) {
        builder.select("users.id", "name");
      },
    };
  }

  static get relationMappings() {
    return {
      files: {
        relation: Model.HasManyRelation,
        modelClass: File,
        join: {
          from: "users.id",
          to: "file.userId",
        },
      },
    };
  }
}

export default User;
