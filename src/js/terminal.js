import { table } from 'table';
import { query } from 'mysql-emulator';
import $ from 'jquery';
import 'jquery.terminal';
import 'jquery.terminal/css/jquery.terminal.min.css';

import { greetings } from './greetings';
import reservedWords from './reserved-words.json';

const keywords = new Set([
  ...reservedWords,
  ...reservedWords.map((w) => w.toLowerCase()),
]);
const formatter = (string) => string.split(/((?:\s|&nbsp;)+)/).map((word) => {
  return keywords.has(word) ? `[[b;#BABABA;]${word}]` : word;
}).join('');
$.terminal.defaults.formatters.push(formatter);

const drawTable = (data) => table(data, {
  border: {
    topBody: `─`,
    topJoin: `┬`,
    topLeft: `┌`,
    topRight: `┐`,
    bottomBody: `─`,
    bottomJoin: `┴`,
    bottomLeft: `└`,
    bottomRight: `┘`,
    bodyLeft: `│`,
    bodyRight: `│`,
    bodyJoin: `│`,
    joinBody: `─`,
    joinLeft: `├`,
    joinRight: `┤`,
    joinJoin: `┼`,
  },
});

async function processor(sql) {
  if (!sql) {
    return;
  }
  const result = await query(sql);
  if (Array.isArray(result) && result.length > 0) {
    const [firstRow] = result;
    if (typeof firstRow === 'object') {
      const keys = Object.keys(firstRow);
      const data = result.reduce((res, row) => [
        ...res,
        keys.map((k) => row[k]),
      ], [keys]);
      this.echo(drawTable(data));
    } else {
      const data = result.map((row) => [row]);
      this.echo(drawTable(data));
    }
  } else if (typeof result === 'object') {
    const data = Object.keys(result).reduce((res, key) => [
      ...res,
      [key, result[key]],
    ], []);
    this.echo(drawTable(data));
  } else {
    this.echo(JSON.stringify(result));
  }
}

const initialSql = `
CREATE TABLE users (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  PRIMARY KEY (id)
);
INSERT INTO users VALUES (DEFAULT, 'John'), (DEFAULT, 'Jane');
`;
export const mountTerminal = async (selector) => {
  for (const sql of initialSql.split(';')) {
    const trimmedSql = sql.trim();
    if (trimmedSql) {
      await query(trimmedSql);
    }
  }

  $(selector).terminal(processor, {
    greetings,
    name: 'mysql-emulator',
    prompt: 'mysql> ',
    onInit: t => t.echo(initialSql),
  });
};
