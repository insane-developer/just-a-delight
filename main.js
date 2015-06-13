var fs = require('fs');/*,
	materials = parseXSDIR('xsdir');*/
//console.log(materials);

module.exports = {
    parseFile: parseFile,
    parseXSDIR: parseXSDIR,
    xmlOutputXSDIR: xmlOutputXSDIR,
    xmlOutputFile: xmlOutputFile,
};

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
            throw new TypeError('Бинарный файл ' + data[1]);
            break;
        }
		materials[ match[1] + '.' + match[2] + match[3] ] = {
			continuous: match[3] === 'c',
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

function parseFile( filename ){
    var file = fs.readFileSync( filename, 'utf-8' ),
        material,
        data = [],
        regexp = /^\s*(\d{4,6})\.(\d{2}[ch])\s*([^\s]*)\s*([^\s]*)\s*([^\s]*)\s*^.+\s*/igm;
    do{
        material = regexp.exec( file );
        if( material ){
            data.push({
                atomicNumber: Number(material[1].substr(0, material[1].length - 3)),
                massNumber: Number(material[1].substr(material[1].length - 3)),
                lib: material[2],
                weight: material[3],
                temperature: material[4],
                date: material[5],
                index: regexp.lastIndex
            });
        }
    }while( material );
    var item, nextItem, i, l = data.length;
    for( var i = 0; i < l; i++ ){
        item = data[i];
        nextItem = data[i + 1];
        item.data = file.substr( item.index, nextItem && nextItem.index );
        parseMaterial( data[i] );
        findReactions( data[i] );
        cleanMat( data[i] );
    }
    return data;
    
}
function parseMaterial( mat ){
    var values = mat.data.match(/\s*([^\s]+)/img),
        index = 1 + 8 * 4, /* пропустить нули*/
        i;
    if( !values ){
        throw new Error('Не парсится материал');
        return;
    }
    for( i = 0; i < values.length; i++ ){
        values[i] = values[i].trim();
    }
    mat.dataLength = values[ index++ ];
    var nxs = ['nes', 'ntr', 'nr', 'nrtp'];
    mat.nxs = {};
    for( i = 0; i < nxs.length; i++ ){
        mat.nxs[ nxs[i] ] = values[ index + i ];
    }
    index += i + 2 + 8;/* 2 лишних параметра + 1 лишняя строчка с 8 параметрами */
    mat.jxs = {};
    var jxs =  ['fsz', 'nu', 'mtr', 'lqr', 'tyr', 'lsig', 'sig', 'land',
                'and', 'ldlw', 'dlw', 'gpd', 'mtrp', 'lsigp', 'sigp', 'landp',
                'andp', 'ldlwp', 'dlwp', 'yp', 'fis', 'end'];
    var indexes = [], value, valueIndex;
    for( i = 0; i < jxs.length; i++ ){
        value = values[ index + i ].trim();
        if( value && value !== '0' ){
            valueIndex = indexes.push( value );
            mat.jxs[ jxs[i] ] = valueIndex - 1;
        }
    }

    index += i + 2 + 8 - 1;
    for( i in mat.jxs ){
        valueIndex = mat.jxs[ i ];
        mat.jxs[ i ] = {
            begin: Number( indexes[ valueIndex ] ),
            end: Number( indexes[ valueIndex + 1 ] )
        }
    }
    /* теперь сделаем кучу массивов */
    for( i in mat.jxs ){
        value = mat.jxs[ i ];
        
        mat.jxs[ i ] = values.slice( index + value.begin, index + value.end )
    }
}
function findReactions( mat ){
    var energyTable = mat.jxs.fsz,
        energyEntriesCount = Number( mat.nxs.nes ),
        total = {}, // MT1
        absorption = {}, // MT27
        elastic = {}, // MT2
        i, energy; 
    
    for( i = 0; i < energyEntriesCount; i++ ){
        energy = energyTable[ i ];
        total[ energy ] = energyTable[ energyEntriesCount + i ];
        absorption[ energy ] = energyTable[ 2*energyEntriesCount + i ];
        elastic[ energy ] = energyTable[ 3*energyEntriesCount + i ];
    }
    mat.reactions = {
        '1' : total,
        '2' : elastic,
        '27' : absorption
    }
}
function cleanMat( mat ){
    delete mat.jxs;
    delete mat.nxs;
    delete mat.index;
    delete mat.lib;
    delete mat.data;
}
function attrs(data){
    str = '';
    for(var name in data){
        if(data.hasOwnProperty(name)){
            str += ' ' + name + '="' + data[name] + '"';
        }
    }
    return str;
}
function xmlOutputXSDIR( data ){
    var str = '<xsdir>';
    for(var id in data){
        if(data.hasOwnProperty(id)){
            var elem = data[id];
            elem.id = id;
            str += '\t<element' + attrs(elem) + '/>\n';
        }
    }
    str += '</xsdir>';
    return str;
}
function xmlOutputFile( data ){
    var str = '<materials>\n';
    for(var i = 0, l = data.length; i < l; i++){
        var mat = data[i];
        
        str += '\t<material' + attrs({
                atomicNumber: mat.atomicNumber,
                massNumber: mat.massNumber,
                temperature: mat.temperature,
                date: mat.date
            })+ '>\n';
        for( var num in mat.reactions ){
            var reaction = mat.reactions[num];
            str += '\t\t<reaction mt="' + num + '">\n';
            for( var energy in reaction ){
                str += '\t\t\t' + energy + '; ' + reaction[ energy ] + ';\n';
            }
            str += '\t\t</reaction>\n';
        }
        str += '\t</material>\n';
    }
    str += '</materials>';
    return str;
}