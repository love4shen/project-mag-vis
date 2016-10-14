const fs = require('fs');

// git command for diff file
// git whatchanged --until="now" --minimal --numstat --ignore-all-space --pretty=format:"%cn%n%ct"

let nodes = [{
  id: '/',
  amount: 0,
  fileName: '',
  isFile: false,
}];
const visitedNode = new Set();
let links = [];
const visitedDir = new Set();
const mapIdToNode = {};


fs.readFile('some.diff', 'utf8', (err, data) => {
  if (err) throw err;

  // find all commits
  const matches = data.match(/([a-zA-Z ]+)\n(\d+)\n(\d+\t\d+\t[a-zA-Z0-9\.\/\-]+\n)+/g);
  const nodes = new Set();

  const parsed = matches.map(d => {
    // find commiter name, time, files arr
    return d.match(/([a-zA-Z ]+)\n(\d+)\n((?:\d+\t\d+\t[a-zA-Z0-9\.\/\-]+\n)+)/)
    .slice(1, 4).map((e, i) => {
      // name, time
      if (i !== 2) return e;

      // find file for each change
      return e.split('\n').slice(0, -1).map(file => file.split('\t').map((f, j) => {
        if (j !== 2) return f;

        // split file path
        return f.split('/');

        // combine add and delete number of lines
      })).map(file => [Number(file[0]) + Number(file[1]), file[2]])
    })
  }).reverse();

  const timeSpan = parsed.map(e => e[1]);
  const trees = {};
  parsed.forEach(entry => {
    const [committer, timeStamp, changes] = entry;

    trees[timeStamp] = {
      committer,
      data: convertChangesToData(changes),
    }
  });

  fs.writeFile('miserables.json', JSON.stringify({
    timeSpan,
    trees,
  }), function(err) {
    if (err) return console.log(err);

    console.log("The file was saved!");
  });
});

// use global variable
function convertChangesToData (changes) {
  const nodesCopy = JSON.parse(JSON.stringify(nodes));
  const linksCopy = JSON.parse(JSON.stringify(links));

  changes.forEach(change => {
    const [amount, file] = change;

    let prev = '/';

    file.forEach((level, o) => {
      const source = prev;
      const target = prev === '/' ? level : prev + '/' + level;
      const direction = `${source}->${target}`;

      if (o === file.length - 1) {
        if (!(target in mapIdToNode)) {
          const curr = {
            id: target,
            isFile: true,
            fileName: level,
            amount,
          };

          nodesCopy.push(curr);

          mapIdToNode[target] = curr;
        } else {
          mapIdToNode[target].amount += amount;

          nodesCopy.find(e => e.id === target).amount += mapIdToNode[target].amount;
        }
      } else if (!visitedNode.has(target)) {
        visitedNode.add(target);
        nodesCopy.push({
          id: target,
          isFile: false,
          fileName: level,
        })
      }

      if (!visitedDir.has(direction)) {
        visitedDir.add(direction);

        linksCopy.push({
          source,
          target,
        });
      }

      prev = target;
    });
  });

  nodes = nodesCopy;
  links = linksCopy;

  return {
    nodes: nodesCopy,
    links: linksCopy,
  }
}
