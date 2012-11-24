var fs = require('fs'),
	materials = {};

function parseXSDIR( file ){
	var file = fs.readFileSync( file, 'utf-8' ),
		file = file.substr( file.indexOf('directory') + 10 ),
		match,
		materials = {},
		data;

	file = file.split('\n');
	for( var i = 0, l = file.length; i < l; i++ ){
    console.log(file[i]);
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
		materials[ match[1] + '.' + match[2] + match[3] ] = {
			continious: match[3] === 'c',
			weight: data[0],
			file: data[1],
			magic0: data[2],
			magic1: data[3],
			offset: data[4],
            magic2: data[5],
            magic3: data[6],
            magic4: data[7],
            magic5: data[8]
		}
	}
    return materials;
}
materials = parseXSDIR('xsdir');
console.log(materials);
