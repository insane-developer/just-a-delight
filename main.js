var fs = require('fs');/*,
	materials = parseXSDIR('xsdir');*/
//console.log(materials);

function parseXSDIR( file ){
	var file = fs.readFileSync( file, 'utf-8' ),
		file = file.substr( file.indexOf('directory') + 10 ),
		match,
		materials = {},
		data;

	file = file.split('\n');
	for( var i = 0, l = file.length; i < l; i++ ){
        match = file[i].match(/^\s*(\d{1,6})\.(\d{0,2})([ch])\s*(.*?)$/i);
        if( !match ){
            break;
        }
		data = match[4].split(' ');
		//1001.24c  0.999170  la150n   0   1   1   10106  0   0 2.5301E-08
		//1002.24c  1.996800  la150n   0   1  2540 10270  0   0 2.5301E-08
		//1001.24h  0.999170  la150h   0   1   1   15895   
		//1002.24h  1.996800  la150h   0   1  3987 5824 
		//lwtr.01t  0.000000  tmccs    0   1   1   10193
		//lwtr.02t  0.000000  tmccs    0   1  2562 10193
        //39086.70y 85.177000 super    0   1   1   457
        //39087.70y 86.164000 super    0   1  128  697
        //1001.50m  0.999172  mgxsnp   0   1   1   3249
        //1000.01g  0.999317  mgxsnp   0   1  826  583
        //1000.02p  0.999317  mcplib02 0   1   1   623    0   0 0.0000E+00
        //2000.02p  3.968217  mcplib02 0   1  169  623    0   0 0.0000E+00
        //1000.03e  0.999317  el03     0   1   1   2329   0   0  .0
        //2000.03e  3.968217  el03     0   1  596  2329   0   0  .0
		// -   - -    [0]      [1]    [2] [3] [4]   [5]  [6] [7]   [8]
        if( data[3] === 2 ){
            console.log('ERROR: Ѕинарный файл будет пропущен');
            break;
        }
		materials[ match[1] + '.' + match[2] + match[3] ] = {
			continious: match[3] === 'c',
			atomicNumber: Number(match[1].substr(0, match[1].length - 3)),
            massNumber: Number(match[1].substr(match[1].length - 3)),
            weight: data[0],
			file: data[1],
			offset: data[4],/* номер строки */
            length: (data[5] + 3)/4 + 12,
            temperature: data[8] /* MeV */
		}
	}
    return materials;
}
parseFile('la150n');
function parseFile( filename ){
    var file = fs.readFileSync( filename, 'utf-8' ),
        material,
        data = [],
        regexp = /^\s*(\d{4,6}\.\d{2}[ch])\s*([^\s]*)\s*([^\s]*)\s*([^\s]*)\s*^.+\s*/igm;
    console.log( 'begin' );
    do{
        material = regexp.exec( file );
        if( material ){
            data.push({
                zaid: material[1],
                weight: material[2],
                temperature: material[3],
                date: material[4],
                index: regexp.lastIndex
            });
        }
    }while( material );
    console.log('indexes');
    var item, nextItem, i, l = data.length;
    for( var i = 0; i < l; i++ ){
        item = data[i];
        nextItem = data[i + 1];
        item.data = file.substr( item.index, nextItem && nextItem.index );
    }
    console.log( data.length );
    console.log( data[0] );
}


function parseFile2( filename ){

    var file = fs.readFileSync( filename, 'utf-8' );
    var obj = {
            zaid: readValue( file ),
            awr: readValue( file ),
            temperature: readValue( file ),
            date: readValue( file )
        },
        l = 5;
    while( l-- ){
        readLine( file ); // пропуск коммента, идентификатора и 4х строчек нулей
    }
    /* NXS */
    obj.dataLength = readValue( file );
    readValue( file ); // пропуск ZA
    obj.NES = readValue( file );
    obj.NTR = readValue( file );
    obj.NR = readValue( file );
    obj.NTRP = readValue( file );
    /* 2 лишних параметра + 1 лишн€€ строчка с 8 параметрами */
    l = 10;
    while( l-- ){
        readValue( file );
    }
    /* JXS */
    obj.pointers = {
        FSZ: Number(readValue( file )),
        NU: Number(readValue( file )),
        MTR: Number(readValue( file )),
        LQR: Number(readValue( file )),
        TYR: Number(readValue( file )),
        LSIG: Number(readValue( file )),
        SIG: Number(readValue( file )),
        LAND: Number(readValue( file )),
        AND: Number(readValue( file )),
        LDLW: Number(readValue( file )),
        DLW: Number(readValue( file )),
        GPD: Number(readValue( file )),
        MTRP: Number(readValue( file )),
        LSIGP: Number(readValue( file )),
        SIGP: Number(readValue( file )),
        LANDP: Number(readValue( file )),
        ANDP: Number(readValue( file )),
        LDLWP: Number(readValue( file )),
        DLWP: Number(readValue( file )),
        YP: Number(readValue( file )),
        FIS: Number(readValue( file )),
        END: Number(readValue( file ))
    }
    readValue( file );
    readValue( file );
    readLine( file );    
    /* закончили, дальце цифры */
    l = obj.pointers.END;
    var data = [];
    while( l-- ){
        data.push( readValue( file ) );
    }
    obj.data = data;
    //console.log( obj );
}