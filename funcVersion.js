// antinga versão 

async function afileOrganizerBeta(pathModel, destination, deleteRM){
    try{
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

        const [textFiles, videoFiles, imageFiles, unknownTypes] = [[],[],[],[]];
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

        for(const file of filePaths){
            const lastPart = path.basename(file);
            const ext = path.extname(file);
            categories[ext]?.push(file);

            const status = await fsPromises.stat(file);
            const time = status.atime;

            const statusSize = calcBytes(status.size);
            const currentPath = `${destination}/${fileArg[statusSize.measure]}/${extFile[ext]}`;
            const logFileDir = `${destination}/log.txt`;
            const logFile = `
                    Arquivo: ${lastPart}
                    Tamanho: ${statusSize.result}
                    Tipo: ${status.isFile() ? 'Arquivo' : 'Pasta'}
                    Ultimo acesso: ${remodelData(time)}
                    Movido para: ${currentPath}/${lastPart}
                `
                await fsPromises.mkdir(currentPath, {
                    recursive: true
                });
                
                await fsPromises.rename(`${file}`, `${currentPath}/${lastPart}`);
                await fsPromises.appendFile(logFileDir, logFile);

            };
            deleteRM 
            ? await fsPromises.rm(pathModel, { recursive: true }) 
            : console.log('Extração concluida!') 
    } catch (err){
        console.log(err);
    }
}

async function testeMap(valorRecebido){
    const mapa = new Map();
    const copy = [];
    const tudo = await fsPromises.readdir(valorRecebido);
    const pastas = tudo.filter(e => {
        return fs.statSync(path.join(valorRecebido, e)).isFile() === false  
    }).map(e => {
        return path.join(valorRecebido, e);
    });

    const arquivos = tudo.filter(e => {
        return fs.statSync(path.join(valorRecebido, e)).isFile() === true 
    }) .map(b => {
        return path.join(valorRecebido, b)
    });

    for(let x = 0; x < pastas.length; x++){
        const certeza = await fsPromises.readdir(pastas[x]);
        for(const atual of certeza){
            if(fs.statSync(path.join(pastas[x], atual)).isFile()){
                arquivos.push(path.join(pastas[x], atual))
                continue;
            }
            pastas.push(path.join(pastas[x], atual))
        }
    }

    for(const atual of arquivos){
        const tamanho = await fsPromises.stat(atual);
        mapa.set(tamanho.size,
            (mapa.get(tamanho.size) || 0) + 1
        );
        console.log(`
        \n
        O arquivo: "${atual.split('\\').at(-1)}" 
        possui:${mapa.get(tamanho.size)} copias...
        `);
    };
}

async function filterClones(baseArr, deleteCopy = false){
            const copyFilesReturnArray = [];
            const [Bytes, kb, mb, gb, tb] = [[],[],[],[],[]];
            const extMimic = {
                'Bytes' : Bytes,
                'KB' : kb,
                'MB' : mb,
                'GB' : gb,
                'TB' : tb,
            };
            
            for(let x = 0; x < baseArr.length; x++){
                const sizeFile = await fsPromises.stat(baseArr[x])
                const calcSize = objFileOrganizer.calcBytes(sizeFile.size);
            
                extMimic[calcSize.measure]?.push(baseArr[x]);
                const fileCompare = await fsPromises.stat(baseArr[x]);
                const currentFileCompare = objFileOrganizer.calcBytes(fileCompare.size);
            };
            
            if(kb.length > 0){
                for(let y = 0; y < kb.length; y++){
                    const result = await fsPromises.stat(kb[y]);
                    const resultCompare = objFileOrganizer.calcBytes(result);
                    
                    let totalCopy = 0;
                    for(let x = 0; x < kb.length; x++){
                        let z = x + 1;  
                        if(kb[z] == undefined){ break; }
                        const lastPartFile = kb[y].split('\\').at(-1);
                        const lastPartFileCopy = kb[z].split('\\').at(-1);

                        if(lastPartFile != lastPartFileCopy) { continue }
                        const fileCompare = await fsPromises.stat(kb[z]);

                        if(result.size === fileCompare.size){
                            const resultCompareRead = await objFileOrganizer.gerarHash(kb[y]);
                            const currentFileCompareRead = await objFileOrganizer.gerarHash(kb[x]);
                            
                            if(currentFileCompareRead === resultCompareRead){
                                totalCopy += 1;
                                console.log('Mesmo Arquivo!');

                                copyFilesReturnArray.push(deleteCopy == true ? 
                                [
                                    `
                                    O arquivo: ${lastPartFile}
                                    Tem um total de: ${totalCopy}
                                    Que foram apagadas.
                                    `,
                                    totalCopy
                                ] 
                                :
                                [
                                    `
                                    O arquivo: ${lastPartFile}
                                    Tem um total de: ${totalCopy} copias.
                                    `,
                                    totalCopy
                                ]);
                            }
                        }
                    }
                }
            }
        }