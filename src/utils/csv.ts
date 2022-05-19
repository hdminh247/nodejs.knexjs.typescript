import { parse } from "csv-parse/sync";
import axios from "axios";

export const parseCsv = async (url: string): Promise<any> => {
  return new Promise(async (resolve) => {
    try {
      const res = await axios({ url, method: "GET", responseType: "blob" });
      resolve({
        data: parse(res.data, {
          columns: true,
          skip_empty_lines: true,
        }),
        error: false,
      });
    } catch (e) {
      resolve({ error: true });
    }
  });
};
