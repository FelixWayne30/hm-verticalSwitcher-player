// common/fileUtil.js
// 通过 plus.io 列出目录下视频文件（递归）
// 返回 Promise，resolve -> [{name, fullPath, extension, size}]
const VIDEO_EXT = ['mp4','mkv','mov','webm','ts','flv','avi','m4v'];

function isVideoFile(name){
  const p = (name||'').toLowerCase();
  const ext = p.split('.').pop();
  return VIDEO_EXT.includes(ext);
}

export function listFilesInDirectory(rootUrl){
  return new Promise((resolve, reject) => {
    if (typeof plus === 'undefined' || !plus.io) {
      reject(new Error('plus.io not available. Must run in App environment (HBuilderX).'));
      return;
    }
    plus.io.resolveLocalFileSystemURL(rootUrl, entry => {
      const results = [];
      const reader = entry.createReader();
      // readEntries returns chunks; do simple wrapper
      function readAll(){
        reader.readEntries(entries => {
          if (!entries || entries.length === 0) {
            resolve(results);
            return;
          }
          let pending = entries.length;
          entries.forEach(en => {
            if (en.isDirectory) {
              // recurse
              listFilesInDirectory(en.fullPath).then(arr => {
                results.push(...arr);
                pending--;
                if (pending === 0) readAll();
              }).catch(()=> {
                pending--;
                if (pending === 0) readAll();
              });
            } else {
              if (isVideoFile(en.name)) {
                // get metadata size if needed
                en.file(file => {
                  results.push({
                    name: en.name,
                    fullPath: en.fullPath,
                    size: file.size,
                    lastModified: file.lastModifiedDate
                  });
                  pending--;
                  if (pending === 0) readAll();
                }, (err) => {
                  // fallback push minimal info
                  results.push({name: en.name, fullPath: en.fullPath});
                  pending--;
                  if (pending === 0) readAll();
                });
              } else {
                pending--;
                if (pending === 0) readAll();
              }
            }
          });
        }, err => {
          // readEntries failed (maybe empty)
          resolve(results);
        });
      }
      readAll();
    }, err => {
      reject(err);
    });
  });
}

// helper to list common public downloads/documents
export function listDownloads(){
  // PUBLIC_DOCUMENTS maps to "_documents" prefix in plus.io
  // for Android it maps to app-specific documents; to read shared downloads, you can try "_downloads" or raw path like "/sdcard/Download"
  // We'll try the common locations in order:
  const candidates = ['_downloads', '_documents', '/sdcard/Download', plus.io.PUBLIC_DOCUMENTS];
  const tryNext = idx => {
    if (idx >= candidates.length) return Promise.resolve([]);
    const url = candidates[idx];
    return listFilesInDirectory(url).catch(()=> tryNext(idx+1));
  };
  return tryNext(0);
}
