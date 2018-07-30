export default {
	/**
	 * clear children nodes
	 * @param {HTMLElement} ele 
	 */
	clrChld(ele){
		if(!ele){
			return;
		}

		var child = ele.lastChild;

		while(child) {
			var tmp = child.previousSibling;
			ele.removeChild(child);
			child = tmp;
		}
	}
};