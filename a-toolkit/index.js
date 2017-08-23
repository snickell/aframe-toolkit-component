import './a-ui-toolkit';
import { registerDreem } from './dreem-imports';
import define from '../system/base/define';
import defineRequire from '../system/base/define.require';

function registerCustomDreem(name, dreemClass) {
	const path = `custom/${name}`;
	registerDreem(path, dreemClass);
}

window.registerCustomDreem = registerCustomDreem;

export { registerCustomDreem }