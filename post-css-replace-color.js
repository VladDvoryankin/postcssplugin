const postcss = require('postcss');
const parseColor = require('parse-color');

function checkIfTargetProp(prop, targetProps) {
	targetProps = targetProps || [];
	return targetProps.indexOf(prop) > -1;
}

function compareRegExpMatchToColorArr(regExpMatch, colorArr) {
	if (!regExpMatch || !colorArr) {
		return false;
	}

	for(let i = 0; i < colorArr.length; i++) {
		if (parseInt(regExpMatch[i + 1]) !== parseInt(colorArr[i])) {
			return false;
		}
	}

	return true;
}

function makeShortHex(hex) {
	return '#' + hex.substring(1, 2) + hex.substring(3, 4) + hex.substring(5, 6);
}

function compareShortHexToFullHex(short, full) {
	return short && full && short[0].toLowerCase() === makeShortHex(full);
}

function replaceColorIfFound(string, color, newColor) {
	// word
	const wordReg = new RegExp('(^' + color.keyword + '$)|(\s' + color.keyword + ')|(' + color.keyword + '\s)', 'i');
	if (wordReg.test(string)) {
		return string.replace(wordReg, (newColor.keyword || newColor.hex));
	}

	// 3 hex
	const hex3Reg = new RegExp(/((#[0-9a-zA-Z]{3}$)|(#[0-9a-zA-Z]{3}\s))/, 'i');
	const hex3Values = string.match(hex3Reg);
	if (compareShortHexToFullHex(hex3Values, color.hex)) {
		return string.replace(new RegExp(/#[0-9a-zA-Z]{3}$/i), makeShortHex(newColor.hex));
	}

	// 6 hex
	const hex6Reg = new RegExp(/(#[0-9a-zA-Z]{6})/, 'gi');
	const hex6Values = string.match(hex6Reg);
	if (hex6Reg.test(string) && hex6Values[0].toLowerCase() === color.hex) {
		return string.replace(hex6Reg, newColor.hex);
	}

	// rgb
	const rgbReg = new RegExp(/rgb\(([0-9]+),\s?([0-9]+),\s?([0-9]+)\)/, 'i');
	const rgbValues = string.match(rgbReg);
	if (compareRegExpMatchToColorArr(rgbValues, color.rgb)) {
		return string.replace(rgbReg, 'rgb(' + newColor.rgb[0] + ', ' + newColor.rgb[1] + ', ' + newColor.rgb[2] + ')');
	}

	// rgba
	const rgbaReg = new RegExp(/rgba\(([0-9]+),\s?([0-9]+),\s?([0-9]+),\s?([\.0-9]+)\)/, 'i');
	const rgbaValues = string.match(rgbaReg);
	if (compareRegExpMatchToColorArr(rgbaValues, color.rgb)) {
		return string.replace(rgbaReg, 'rgba(' + newColor.rgba[0] + ', ' + newColor.rgba[1] + ', ' + newColor.rgba[2] + ', ' + rgbaValues[4] + ')');
	}

	// hsl
	const hslReg = new RegExp(/hsl\(([0-9]+),\s?([0-9]+)\%,\s?([0-9]+)\%\)/, 'i');
	const hslValues = string.match(hslReg);
	if (compareRegExpMatchToColorArr(hslValues, color.hsl)) {
		return string.replace(hslReg, 'hsl(' + newColor.hsl[0] + ', ' + newColor.hsl[1] + '%, ' + newColor.hsl[2] + '%)');
	}

	// hsla
	const hslaReg = new RegExp(/hsla\(([0-9]+),\s?([0-9]+)\%,\s?([0-9]+)\%,\s?([\.0-9]+)\)/, 'i');
	const hslaValues = string.match(hslaReg);
	if (compareRegExpMatchToColorArr(hslaValues, color.hsl)) {
		return string.replace(hslaReg, 'hsla(' + newColor.hsla[0] + ', ' + newColor.hsla[1] + '%, ' + newColor.hsla[2] + '%, ' + hslaValues[4] + ')');
	}

	return string;
}

module.exports = postcss.plugin('replace-color', opts => {
	opts = Object.assign({}, opts, {
		from: parseColor((opts.from ? opts.from : 'black')),
		to: parseColor((opts.to ? opts.to : 'white'))
	});

	console.log('\n\nReplace color:\n\n', opts.from, '\n\nto:\n\n', opts.to, '\n')

    return root => {
        root.walkRules(rule => {
            rule.walkDecls(decl => {
                if (checkIfTargetProp(decl.prop, opts.targetProps)) {
                	decl.value = replaceColorIfFound(decl.value, opts.from, opts.to);
                }
            });
        });
    };
});
