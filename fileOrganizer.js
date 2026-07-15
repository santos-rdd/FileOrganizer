import fs from 'node:fs';
import fsPromises from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

// Recebe o caminho da pasta
// Verifica as extenções e tamanho
// Separa os arquivos por extenções e tamanhos em pastas diferentes
// Copia para uma pasta outra pasta de dentro desse projeto
// Anota a criação de cada processo em um arquivo de log  
// Anota seus tamanhos, nomes e para qual pasta foram 
// Mostra a mensagem de conclusão no console

const objFileOrganizer = {
      
        calcBytes: (bytes)=>{
            if(bytes === 0) return '0 Bytes';

                let k = 1024;
                const tamanhos = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

                const i = Math.floor(Math.log(bytes) / Math.log(k));
                return { 
                    result: parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + tamanhos[i],
                    measure: tamanhos[i]
                }
        },
    
        remodelData: (data)=>{
             let [day, month, year, hour, minutes] = [
                data.getDate(), 
                data.getMonth(), 
                data.getFullYear(),
                data.getHours(),
                data.getMinutes()
            ];
            const [dateUnformatted, dateFormatted] = [[],[]];
            dateUnformatted.push(day, month, hour, minutes);

            for(const date of dateUnformatted){
                let result = String(date).padStart(2, '0');
                dateFormatted.push(result)
            }

            const message = `${dateFormatted[0]}/${dateFormatted[1]}/${year} as ${dateFormatted[2]}:${dateFormatted[3]}`
            return message;
            },
        

        gerarHash: (file) => {
            return new Promise((resolve, reject)=>{
                const hash = crypto.createHash('sha256');  
                const stream = fs.createReadStream(file);
                stream.on('data', chunk => hash.update(chunk));
                stream.on('error', (err)=> {
                    console.log(`Erro na leitura do arquivo: ${err}`)
                    reject(err)
                })
                stream.on('end', ()=>{
                    resolve(hash.digest('hex'));
                });
            })
        },

        filterClones: async (baseArr, deleteCopy)=>{
            const mapa = new Map();
            const hashMapsFiles = new Map();
            const sameFilesFound = new Map();
            const doubtCopyMap = [];
            
            for(const currentFile of baseArr){
                const currentSize = await fsPromises.stat(currentFile);

                if (!mapa.has(currentSize.size)) {
                    mapa.set(currentSize.size, []);
                }

                mapa.get(currentSize.size).push(currentFile)

                if(mapa.get(currentSize.size).length >= 2){
                    for(const currentCopy of mapa.get(currentSize.size)){
                        const resultFind = doubtCopyMap.find(e => currentCopy === e);
                        if(resultFind) continue;
                        doubtCopyMap.push(currentCopy);
                    }
                }
            };
            if(doubtCopyMap.length >= 1){
                const hashes = await Promise.all(
                    doubtCopyMap.map(e => objFileOrganizer.gerarHash(e))
                )
                doubtCopyMap.forEach((currentHash, indiceHash)=>{
                    hashMapsFiles.set(currentHash, hashes[indiceHash])
                })
                for(let x = 0; x < doubtCopyMap.length; x++){
                    const resultMap = hashMapsFiles.get(doubtCopyMap[x]);
                    for(let y = 0; y < doubtCopyMap.length; y++){
                        if(
                            resultMap === 
                            hashMapsFiles.get(doubtCopyMap[y])
                        ){
                            if(!sameFilesFound.has(doubtCopyMap[x])){
                                sameFilesFound.set( doubtCopyMap[x], []);
                            }
                            sameFilesFound.get(doubtCopyMap[x]).push(doubtCopyMap[y])
                        }
                    }
                }

                const keysSizeFiles = [...sameFilesFound.keys()];
                const sizeArray = [];
                
                for(const keysFiles of keysSizeFiles){
                    sizeArray.push(await Promise.all( 
                        sameFilesFound.get(keysFiles).map(async e => {
                            const stats = await fsPromises.stat(e)
                            return stats.size 
                        }) 
                    ));
                }

                const resultTotalSize = sizeArray
                    .map(arr => arr.reduce((acc, crr) => acc + crr, 0))
                    .reduce((acc, crr) => acc + crr, 0);

                if(deleteCopy){
                    for(const deleteCopy of keysSizeFiles){
                        for(let x = 0; x < keysSizeFiles.length; x++){
                            if(sameFilesFound.get(deleteCopy)[x]){
                                await fsPromises.unlink(sameFilesFound.get(deleteCopy)[x])
                            }
                        }
                    } 
                }

                const resultTotalCopySizes = objFileOrganizer.calcBytes(resultTotalSize)
                const messege = objFileOrganizer.copyDiagnosis(sameFilesFound, resultTotalCopySizes.result, deleteCopy);
                return messege;
            }
        },

        copyDiagnosis: (copyDetails, total, deleteCopy)=>{
            const boxKeys = [...copyDetails.keys()];
            let constructMessage = '';
            
            for(const currentDetails of boxKeys){
                const currentDetailsCopyName = currentDetails.split('\\').at(-1);
                const totalSize = copyDetails.get(currentDetails).length;
                if(!deleteCopy){
                    constructMessage += 
                    `
                    \n
                        O arquivo: ${currentDetailsCopyName} 
                        Da pasta: ${currentDetails}
                        Possui um total de: ${totalSize} copias 
                        O peso total dos arquivos iguais é de: ${total}
                        Copias:${copyDetails.get(currentDetails).map(e => `
                            ${e.split(`\\`).at(-1)}`)}` 
                        continue
                    }

                    constructMessage += 
                    `
                    \n
                        O arquivo: ${currentDetailsCopyName} 
                        Da pasta: ${currentDetails}
                        Possui um total de: ${totalSize} copias 
                        Foi limpo o total de: ${total}
                        Copias:${copyDetails.get(currentDetails).map(e => `
                            ${e.split(`\\`).at(-1)}`)}` 
            }

            return constructMessage;
        },

        fileOrganizerBeta: async (pathModel, destination, deleteRM = false, deleteUN = false, expandedSearch = false) => {
              try{
                if(!pathModel && !destination){ return console.log('Valores não enviados!') };

                const paths = await fsPromises.readdir(pathModel);
                const filePaths = paths.filter(current => {
                    return fs.statSync(path.join(pathModel, current)).isFile()
                }).map(file => {
                    return path.join(pathModel, file);
                })
                
                const foldersPaths = paths.filter(current => {
                    return !fs.statSync(path.join(pathModel, current)).isFile() }).map(folder => {
                        return path.join(pathModel, folder);
                    });
                    
                    const [textFiles, videoFiles, imageFiles, unknownTypes, unDeletedFiles] = [[],[],[],[],[]];
                    const categories = {
                        '.txt': textFiles,
                        '.mp4': videoFiles,
                        '.png': imageFiles,
                        '.jpg': imageFiles,
                        '.jpeg': imageFiles,
                        'undefined': unknownTypes,
                    };
                    
                    const fileArg = {
                        'Bytes': 'small', 
                        'KB': 'small', 
                        'MB': 'average', 
                        'GB': 'big', 
                        'TB': 'big'
                    };
                    
                    const extFile = {
                        '.txt': 'text',
                        '.mp4': 'videos',
                        '.png': 'image',
                        '.jpg': 'image',
                        '.jpeg': 'image',
                        'undefined': 'unknownTypes',
                    }
                    
                    if(expandedSearch){
                        for(let x = 0; x < foldersPaths.length; x++){
                            let folder = foldersPaths[x];
                            const currentDoubt = await fsPromises.readdir(folder);
                            for(const doubt of currentDoubt){
                                const statsDoubt = fs.statSync(path.join(folder, doubt));
                                
                                if(statsDoubt.isFile()){ 
                                    const pathFile = path.join(folder, doubt);
                                    filePaths.push(pathFile); continue 
                                };
                                
                                if(statsDoubt.isDirectory()){
                                    foldersPaths.push(
                                        path.join(folder, doubt)
                                    );
                                }
                            }
                        }
                    }
                    
                    const sameFile = await objFileOrganizer.filterClones(filePaths, deleteUN);
                    const logFileDir = `${destination}/log.txt`;
                    for(const file of filePaths){
                        const status = await fsPromises.stat(file);
                        const time = status.atime;
                        
                        const lastPart = path.basename(file);
                        const ext = path.extname(file);
                        const fileSize = objFileOrganizer.calcBytes(status.size);
                        const currentPath = `${destination}/${fileSize.measure}/${extFile[ext]}`;
                        categories[ext]?.push(file);

                        const logFile =
                `
                    Arquivo: ${lastPart}
                    Tamanho: ${fileSize.result}
                    Tipo: ${status.isFile() ? 'Arquivo' : 'Pasta'}
                    Ultimo acesso: ${objFileOrganizer.remodelData(time)}
                    Movido para: ${currentPath}/${lastPart}
                ` ;

                            await fsPromises.mkdir(currentPath, {
                                recursive: true
                            });
                        
                            await fsPromises.rename(`${file}`, `${currentPath}/${lastPart}`);
                            await fsPromises.appendFile(logFileDir, logFile);
                            if(deleteUN == true) { await fsPromises.appendFile(logFileDir, filesDelete) };
                        };
                        await fsPromises.appendFile(logFileDir, sameFile);
                        if(deleteRM){
                            await fsPromises.rm(pathModel, { recursive: true })
                            console.log('Extração concluida, pastas vazias apagadas!')
                        } 
                        console.log('Extração concluida!') 
            } catch (err){
                console.log(err);
            }
        }
};
// Passe como primeiro argumento a pasta que voce deseja organizar
// Como segundo a pasta que voce deseja mover esse arquivos ou a pasta que voce quer criar 
// O terceiro argumento define se as pastas de onde os arquivos estavam serão apagadas ou não 
// O quarto decide se as copias dos arquivos vao ser apagadas ou não
// O quinto é para ver se ele vai entrar dentro das sub-pastas ou não 
objFileOrganizer.fileOrganizerBeta('./testando', './aprendendo' , false, false, true);
