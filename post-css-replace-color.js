const postcss = require('postcss');
const parseColor = require('parse-color');
const csstree = require('css-tree');

function checkIfTargetProp(prop, targetProps) {
	targetProps = targetProps || [];
	return targetProps.indexOf(prop) > -1;
}

function makeShortHex(hex) {
	return hex.substring(0, 1) + hex.substring(2, 3) + hex.substring(4, 5);
}

function isColorParamsEqual(ast, color) {
	if (!color) {
		return false; //transparent has undefined color params
	}

	let equal = true;
	let i = -1;

	csstree.walk(ast, item => {
		if (item.type === 'Number' || item.type === 'Percentage') {
			i += 1;
			if (i < 3 && parseInt(item.value) !== color[i]) {
				equal = equal && false;
			}
		}
	});

	return equal;
}

function changeColorParams(ast, color) {
	let i = -1;

	csstree.walk(ast, item => {
		if (item.type === 'Number' || item.type === 'Percentage') {
			i += 1;
			if (i < 3 && item.value !== color[i]) {
				item.value = color[i];
			}
		}
	});
}

function changeToTransparent(node) {
	node.type = 'Identifier';
	node.name = 'transparent';
}

module.exports = postcss.plugin('replace-color', opts => {
	opts = Object.assign({}, opts, {
		from: parseColor((opts.from ? opts.from : 'black')),
		to: parseColor((opts.to ? opts.to : 'white'))
	});

	opts.from.keyword = (opts.from.keyword || '').toLowerCase();
	opts.to.keyword = (opts.to.keyword || '').toLowerCase();
	if (opts.from.hex) {
		opts.from.hex = opts.from.hex.replace('#', '');
	}
	if (opts.to.hex) {
		opts.to.hex = opts.to.hex.replace('#', '');
	}

	console.log('\n\nReplace:\n', JSON.stringify(opts.from), '\n\nWith:\n', JSON.stringify(opts.to), '\n')

	return root => {
		root.walkRules(rule => {
			rule.walkDecls(decl => {
				if (checkIfTargetProp(decl.prop, opts.targetProps)) {
					const parsedValue = csstree.parse(decl.value, { context: 'value' });

					csstree.walk(parsedValue, node => {
						if (node.type === 'Identifier' && node.name === opts.from.keyword) {
							console.log('\n', decl.value, '|', node.type, ' > ', opts.to.keyword)
							node.name = opts.to.keyword;
						} else if (opts.from.hex && node.type === 'HexColor' && node.value.length === 3 && node.value === makeShortHex(opts.from.hex)) {
							if (opts.to.keyword === 'transparent') {
								console.log('\n', decl.value, '|', node.type, ' > ', opts.to.keyword)
								changeToTransparent(node);
							} else {
								console.log('\n', decl.value, '|', node.type, ' > ', makeShortHex(opts.to.hex))
								node.value = makeShortHex(opts.to.hex);
							}
						} else if (opts.from.hex && node.type === 'HexColor' && node.value.length === 6 && node.value === opts.from.hex) {
							if (opts.to.keyword === 'transparent') {
								console.log('\n', decl.value, '|', node.type, ' > ', opts.to.keyword)
								changeToTransparent(node);
							} else {
								console.log('\n', decl.value, '|', node.type, ' > ', opts.to.hex)
								node.value = opts.to.hex;
							}
						} else if (node.type === 'Function' && (node.name === 'rgb' || node.name === 'rgba' || node.name === 'hsl' || node.name === 'hsla')) {
							if (isColorParamsEqual(node, opts.from[node.name])) {
								if (opts.to.keyword === 'transparent') {
									console.log('\n', decl.value, '|', node.type, ' > ', opts.to.keyword)
									changeToTransparent(node);
								} else {
									console.log('\n', decl.value, '|', node.type, ' > ', opts.to[node.name][0], opts.to[node.name][1], opts.to[node.name][2])
									changeColorParams(node, opts.to[node.name])
								}
							}
						}
					});

					decl.value = csstree.translate(parsedValue);
				}
			});
		});

		console.log('\n')
	};
});
