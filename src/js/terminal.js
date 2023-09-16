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
const isObject = (o) => o !== null && typeof o === 'object' && !Array.isArray(o);
const formatOutput = (output) => {
  if (Array.isArray(output) && output.length > 0) {
    const [firstRow] = output;
    if (isObject(firstRow)) {
      const keys = Object.keys(firstRow);
      if (keys.length > 0) {
        const data = output.reduce((res, row) => [
          ...res,
          keys.map((k) => row[k]),
        ], [keys]);
        return drawTable(data);
      }
    } else {
      const data = output.map((row) => [row]);
      return drawTable(data);
    }
  } else if (isObject(output)) {
    const keys = Object.keys(output);
    if (keys.length > 0) {
      const data = keys.reduce((res, key) => [
        ...res,
        [key, output[key]],
      ], []);
      return drawTable(data);
    }
  }

  return JSON.stringify(output);
};

async function processor(sql) {
  if (!sql) {
    return;
  }
  try {
    const result = await query(sql);
    this.echo(formatOutput(result));
    window.gtag && window.gtag('event', 'query', { sql });
    window.mixpanel && window.mixpanel.track('query', { sql });
  } catch (err) {
    this.error(err);
    window.gtag && window.gtag('event', 'exception', {
      description: `${err.message}; ${sql}`,
      fatal: false,
    });
    window.mixpanel && window.mixpanel.track('exception', {
      message: err.message,
      sql,
    });
  }
}

const initialSql = `
CREATE TABLE users (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  PRIMARY KEY (id)
);
CREATE TABLE posts (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id INT UNSIGNED NOT NULL,
  description TEXT NOT NULL,
  PRIMARY KEY (id),
  CONSTRAINT FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`)
);
INSERT INTO users VALUES (1, 'John'), (2, 'Jane');
INSERT INTO posts VALUES (DEFAULT, 1, 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.');
`;
export const mountTerminal = async (selector) => {
  for (const sql of initialSql.split(';')) {
    const trimmedSql = sql.trim();
    if (trimmedSql) {
      await query(trimmedSql);
    }
  }

  const t = $(selector).terminal(processor, {
    greetings,
    name: 'mysql-emulator',
    prompt: 'mysql> ',
    onInit: t => t.echo(initialSql),
  });
  t.exec(`SELECT u.*, sum(if(p.id, 1, 0)) post_count FROM users u LEFT JOIN posts p ON u.id = p.user_id GROUP BY u.id`);
};
