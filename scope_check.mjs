let has_violation = false

const objs = __provGetMarkedObjects();
for (let i=0; i<objs.length; i++) {
	const { value, label } = objs[i];
	if (__scopeIsWrapped(value)) {
		if (!has_violation) {
			console.log('Scope violation:')
		}
		console.log({label, value});
		has_violation = true;
	}
}
/*
for (const { value, label } of __provGetMarkedObjects()) {
	if (__scopeIsWrapped(value)) {
		if (!has_violation) {
			console.log('Scope violation:')
		}
		console.log({label, value});
		has_violation = true;
	}
}     
*/



if (has_violation) {
	// 戻り値として返す
} else {
    console.log('No scope violation is found.');
}

has_violation
/*
if (has_violation) {
	process.exit(1);
} else {
    console.log('No scope violation is found.');
}       
*/
