import { Model } from "objection";

// https://vincit.github.io/objection.js/guide/models.html

class File extends Model {
  id!: number;
  userId!: number;
  name!: number;

  static get tableName() {
    return "files";
  }

  static get idColumn() {
    return "id";
  }

  static get relationMappings() {
    return {};
  }
}

export default File;
