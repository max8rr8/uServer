// File for generate db.json in src
// node ./utils/generateMimeTypes >> ./src/mimeDB.json

let db = require('./db.json')

let a1 = ""
let a2 = ""

for(let el in db){
  db[el].extensions.forEach(e=>a1 += `    "${e}": "${el}",\n`)
  a2+=`    "${el}": "${db[el].extensions[0]}",\n`
}
a1 = a1.substr(0, a1.length-2)
a2 = a2.substr(0, a2.length-2)


console.log(`{
  "extensionToMime": {
${a1}
  },
  "mimeToExtensiom": {
${a2}
  }
}`)