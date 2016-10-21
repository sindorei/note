/**
 * Created by wp10081 on 2016/10/18.
 */
'use strict'
require('shelljs/global')
const nodegit = require('nodegit')
const co = require('co')

// var getCommitFile = function () {
//     let filePaths = []
//
//     cd('repo')
//     exec('git pull origin develop')
//     cd('..')
//     nodegit.Repository.open('repo').then(function(repo) {
//         return repo.getCommit('83541f177ce507ee9e4b13fc5806f1e3d8d41b8f')
//     }).then(function(commit) {
//         return commit.getDiff()
//     }).then(function (arrDiff) {
//
//         arrDiff[0].patches().then(function(path) {
//             path.forEach(function(item) {
//                 if(item.status() === 2) {
//                     return
//                 }
//                 filePaths.push(item.newFile().path())
//             })
//
//             return filePaths
//         }).catch(function(e) { console.log(e) })
//     }).catch(function(err) { console.log('error:' +  err) })
// }

let getCommitFile = function (commitid) {
    return co(function* () {
        cd('repo')
        exec('git pull origin develop')
        cd('..')
        let filePaths = []
        let repo = yield nodegit.Repository.open('repo')
        let commit = yield repo.getCommit(commitid)
        let arrDiff = yield commit.getDiff()
        let paths = yield arrDiff[0].patches()
        paths.forEach(function(item) {

            // 排除删除的文件

            if(item.status() === 2) {
                return
            }
            filePaths.push(item.newFile().path())
        })
        return filePaths
    }).catch((e) => { console.log(e) })
}

module.exports = getCommitFile