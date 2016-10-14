const fetch = require('node-fetch');

const repoComp = `love4shen/countdown-menubar--text`;

fetch(`https://api.github.com/repos/${repoComp}/commits`, {
    method: 'GET',
    headers: {'user-agent': 'node.js'}
})
.then((res) => res.json())
.then((data) => { console.log(data); return data.map(e => e.sha)})
.then(shas => {
    shas.map(sha => {
        fetch(`https://api.github.com/repos/${repoComp}/commits/${sha}`)
        .then(res => res.json())
        .then(data => {
            if (!('files' in data)) console.log(data)
            return data.files;
        })
//         .then(files => files.map(file => [file.filename, file.changes]))
//         .then(filesAndChanges => console.log(filesAndChanges))
    })
})
.catch(err => console.log(err))
