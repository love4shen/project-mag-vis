const width = 960;
const height = 600;
let nodes = [];
let links = [];
const force = d3.layout.force()
  .nodes(nodes)
  .links(links)
  .gravity(0.05)
  .linkDistance((l) => l.target.isFile ? Math.sqrt(l.target.amount) * 2 : 20)
  .charge(-100)
  .size([width, height])
  .on("tick", tick);

const svg = d3.select("body").append("svg")
  .attr("width", width)
  .attr("height", height);

let node = svg.selectAll(".node");
let link = svg.selectAll(".link");
let label = svg.selectAll('.label')

function start() {
  link = link.data(force.links(), function (d) { return d.source.id + "-" + d.target.id; });
  link.enter().insert("line", ".node").attr("class", "link");
  link.exit().remove();

  node = node.data(force.nodes(), function (d) { return d.id; }).call(force.drag())
  node.enter()
    .append("circle")
    .attr('data-id', (d) => d.id)
    .attr("class", 'node')
    .attr("r", (d) => {
      if (d.isFile) return Math.sqrt(d.amount) / 3;
      return 4;
    })
    .attr('fill', (d) => d.id === '/' ? '#000' : d.isFile ? '#F44336' : '#2196F3')
    .on("mouseover", (d) => {
      d3.select(`.label[data-id="${d.id}"]`).style('display', null);
    })
    .on("mouseout", (d) => {
      d3.select(`.label[data-id="${d.id}"]`).style('display', 'none');
    });
  node.exit().remove();

  label = label.data(force.nodes(), (d) => d.id)
  label.enter()
    .append("text")
    .attr('x', (d) => d.x)
    .attr('y', (d) => d.y)
    .attr('data-id', (d) => d.id)
    .text((d) => d.fileName)
    .attr("class", 'label')
    .style('display', 'none')
    .on("mouseover", (d) => {
      d3.select(`.label[data-id="${d.id}"]`).style('display', null);
    })
    .on("mouseout", (d) => {
      d3.select(`.label[data-id="${d.id}"]`).style('display', 'none');
    })
  label.exit().remove();

  force.start();
}

function tick() {
  link.attr("x1", function (d) { return d.source.x; })
    .attr("y1", function (d) { return d.source.y; })
    .attr("x2", function (d) { return d.target.x; })
    .attr("y2", function (d) { return d.target.y; });

  node.attr("cx", function (d) { return d.x; })
    .attr("cy", function (d) { return d.y; });
  
  label.attr('x', (d) => d.x)
    .attr('y', (d) => d.y);
}

d3.json("miserables.json", function (err, datum) {
  if (err) throw "Error";

  const { timeSpan, trees } = datum;
  let i = 0;
  const nodesMap = {};
  const linksUnique = new Set();

  for (let i = 0; i < timeSpan.length; i++) {
    const commit = timeSpan[i];
    const { committer: c, data: d } = trees[commit];
    const { nodes: ns, links: ls } = d;
    setTimeout(() => {
      ns.forEach(n => {
        if (n.id in nodesMap) {
          if (n.isFile) {
            d3.selectAll('.node').each(function (d) {
              if (d3.select(this)[0][0].getAttribute('data-id') === n.id) {
                d3.select(this)[0][0].setAttribute('r', Math.sqrt(n.amount) / 3);
              }
            });
          }
        } else {
          nodesMap[n.id] = n;
          nodes.push(nodesMap[n.id]);
        }
      });

      ls.forEach(l => {
        const linkId = `${l.source}->${l.target}`;
        if (!linksUnique.has(linkId)) {
          links.push({
            source: nodesMap[l.source],
            target: nodesMap[l.target],
          });

          linksUnique.add(linkId)
        }
      });

      start();
    }, i * 100);
  }
});