/**
 * To set up JavaScript Transformation open configuration space properties
 * and go to "Configuration Space" -> "Transformation Configuration"
 * and add a JavaScript Transformation Module with this JavaScript.
 */

/**
 * Transformation module instance
 */
var pv_module = module_instance();

/**
 * Do the work of this JavaScript transformation module
 * @return {ClientTransformStatus} the status of this module method
 */
function work() {
	var status = new ClientTransformStatus();
	status.setMessage(Constants().EMPTY_STRING);
	status.setStatus(ClientTransformStatus().OK);

	try {
		var models = pv_module.getModels();
		//iterator over all models
		for (var index = 0;index < models.length; index++) {
			var model = new IPVModel(models[index]);
			// we only want to process Feature Models
			if (model.getType().equals(ModelConstants().CFM_TYPE)
					|| model.getType().equals(ModelConstants().FM_TYPE)) {
				var rootid = model.getElementsRootID();
				printFeatures(model.getElementWithID(rootid));
			}
		}
	} catch (e) {
		// If something went wrong, catch error and return error status with
		// specific error message.
		status.setMessage(e.toString());
		status.setStatus(ClientTransformStatus().ERROR);
	}
	// if no error occurred return OK status
	return status;
}

/**
 * Print the information of a feature to the output file
 * and do to the children.
 * @param {IPVElement} element The element to print
 */
function printFeatures(element) {
	// add information to output file
	out.println("Visible Name:	" + element.getVName());
	out.println("Unique Name:	" + element.getName());
	out.println();
	out.println("Description:");
	out.println();

	/**
	 * Because the description of a feature is stored in html in this model, and
	 * we don't want to see the html tags in our outputfile, we are doing some
	 * formating here.
	 */
	out.print(formatDesc(element.getDesc(null, "text/html")));
	out.println("------------------------------------------------------"
			+ "---------------------------------------------------\n");

	// get Children of current element
	var iter = element.getChildren().iterator();
	while (iter.hasNext()) {
		printFeatures(iter.next());
	}
}

function formatDesc(input) {
	input = input.replaceAll("<p>", "");
	input = input.replaceAll("</p>", "\n\n");
	input = input.replaceAll("&nbsp;", " ");
	input = input.replaceAll("&deg;", "°");
	imput = input.replaceAll("&amp;", "&");
	input = addLineBreaks(input);
	return input;
}

function addLineBreaks(input) {

	if (input.length() < 100) {
		return input;
	}
	i = input.indexOf(" ", 99);
	if (i == -1) {
		return input;
	}
	j = input.indexOf("\n");
	if ((j != -1) && (j < i)) {
		return input.substring(0, j) + "\n"
				+ addLineBreaks(input.substring(j + 1));
	}
	
	return input.substring(0, i) + "\n" + addLineBreaks(input.substring(i + 1));
}