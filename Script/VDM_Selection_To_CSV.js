/**
 * To set up JavaScript Transformation open configuration space properties
 * and go to "Configuration Space" -> "Transformation Configuration"
 * and add a JavaScript Transformation Module with this JavaScript.
 */

/**
 * Transformation module instance
 */
var pv_module = module_instance();

// global variables
var m_Lines;
var m_LevelProvider;

//constants
var FILENAME = "Report.csv";
var NEWLINE = "\n";
var SEPARATOR = ";";

// Package definitions
var File = java.io.File;
var FileReader = java.io.FileReader;
var BufferedReader = java.io.BufferedReader;
var LinkedHashMap = java.util.LinkedHashMap;
var FileWriter = java.io.FileWriter;
var BufferedWriter = java.io.BufferedWriter;
var ElementLabelProvider = com.ps.consul.eclipse.ui.viewer.fm.ElementLabelProvider;
var ElementLevelIndexer = com.ps.consul.eclipse.core.model.attributeprovider.ElementLevelIndexer;

/**
 * Do the work of this JavaScript transformation module
 * @return {ClientTransformStatus} the status of this module method
 */
function work() {
	var status = new ClientTransformStatus();
	status.setMessage(Constants().EMPTY_STRING);
	status.setStatus(ClientTransformStatus().OK);
	try {
		var outFile = new File(pv_module.getOutput() , FILENAME);
		var variantIndex = -1;
		// check if output file exists
		// create if not
		if (outFile.exists() == false) {
			outFile.createNewFile();
		}

		// get concrete models
		var env = pv_module.getVariantEnvironment();
		if (env == null) {
			status.setMessage("Transformation of VRM not supported.");
			status.setStatus(ClientTransformStatus().ERROR);
		}
		else {
			var concreteModels = env.getFeatureModels();
			concreteModels.addAll(env.getFamilyModels());

			// Read entire file
			var fileEmpty = true;
			var inFile = new File(pv_module.getOutput(), FILENAME);
			var reader = new BufferedReader(new FileReader(inFile));
			var inLine = reader.readLine();
			if (inLine == null) {
				fileEmpty = true;
			} else {
				fileEmpty = false;
				//check if current variant model was already exported
				var cols = inLine.split(SEPARATOR);
				for ( var i = 0; i < cols.length; i++) {
					if (pv_module.getVariantModel().getName().equals(cols[i])) {
						//current variant model name found
						variantIndex = i;
						break;
					}
				}
			}

			//create map for storing current read lines
			m_Lines = new LinkedHashMap();

			if (inLine != null) {
				while (inLine != null) {
					var parts = inLine.split(SEPARATOR);
					var element = parts[2];
					//get element ID - it is in the third column
					if (element != null) {
						m_Lines.put(element, inLine.replaceAll(NEWLINE, ""));
					}
					inLine = reader.readLine();
				}
				reader.close();
			}

			//create new FileWriter, which creates a new CSV file
			var writer = new BufferedWriter(new FileWriter(outFile));

			// write header
			var line = null;
			if (fileEmpty == false) {
				//get current header line
				line = m_Lines.get("Element ID");

				//add variant name only, if not part of the CSV
				if ((variantIndex == -1) == true) {
					line = line + SEPARATOR + pv_module.getVariantModel().getName();
				}
			} else {
				// add new header line
				line = "Level;Element Name;Element ID;" + pv_module.getVariantModel().getName();
			}
			//write header line
			writer.write(line + NEWLINE);

			//iterate over all input models
			var iter = concreteModels.iterator();
			while (iter.hasNext()) {
				var model = new IPVModel(iter.next());
				//write line for each model
				writer.write(NEWLINE);
				writer.write(model.getName() + NEWLINE);
				writer.write(NEWLINE);

				//get root element of current model
				var root = model.getElementWithID(model.getElementsRootID());
				//process element lines
				processElement(fileEmpty, writer, root, variantIndex);
			}
			//close file writer
			writer.flush();
			writer.close();
		}
	}
	//if exception occurs
	catch (e) {
		status.setMessage(e.getMessage());
		status.setStatus(ClientTransformStatus.ERROR);
	}
	return status;
}

/**
 * 
 * @param {Boolean} fileEmpty
 * @param {BufferedWriter} writer
 * @param {IPVElement} ipvElement
 * @param {Number} variantIndex
 */
function processElement(fileEmpty, writer, ipvElement, variantIndex) {
	// get selection state string
	var selection = getSelectionStateString(ipvElement);

	var line = null;

	if (fileEmpty) {
		//create element label provider
		var provider = ElementLabelProvider.getGlobalInstance(false);
		//get element name from provider - the element names are calculated as seen in model tree by the provider
		var elementName = provider.getText(ipvElement);
		//get element level from provider - the element levels are calculated as seen in the model table view
		var level = ElementLevelIndexer.getLevel(ipvElement);
		//the model root elements have no level, we simply set 0 here
		if (level == null || (level.length() == 0)) {
			level = "0";
		}
		// the initial element line is composed here
		line = level + SEPARATOR + elementName + SEPARATOR
				+ ipvElement.getID().toString() + SEPARATOR + selection;
	} else {
		// get element line from map
		line = m_Lines.get(ipvElement.getID().toString());
		if ((variantIndex == -1) == true) {
			//first time variant is added, simply add at the end
			line = line + SEPARATOR + selection;
		} else {
			//variant was already part of CSV, update old values
			var parts = line.split(SEPARATOR);
			//set new selection state for current element in current variant model 
			parts[variantIndex] = selection;
			//reset line
			line = "";
			//put line together again
			for ( var i = 0; i < parts.length; i++) {
				line = line + parts[i];
				if (i < (parts.length - 1)) {//add separator only, if not last part
					line = line + SEPARATOR;
				}
			}
		}
	}
	writer.write(line + NEWLINE);

	// process children of current element
	var childs = ipvElement.getChildren();
	var iter = childs.iterator();
	while (iter.hasNext()) {
		//process next child
		processElement(fileEmpty, writer, iter.next(), variantIndex);
	}
}

/**
 * 
 * @param {IPVElement} ipvElement
 * @returns {String}
 */
function getSelectionStateString(element) {
	//get variant model selection element which references current IPVElement
	var varEl = pv_module.getVariantModel().getSelectionOfReference(element);
	var selection = "-";//if no selection decision was made by now, we simply count them as unselected
	if (varEl != null) {//only if selection decision was made by now
		//get selection of current element
		selection = varEl.getType();
		if (selection.equals(ModelConstants().SELECTED_TYPE)) {
			selection = "X";
		}
		if (selection.equals(ModelConstants().EXCLUDED_TYPE)) {
			selection = "Ex";
		}
		if (selection.equals(ModelConstants().UNSELECTED_TYPE)) {
			selection = "-";
		}
		if (selection.equals(ModelConstants().NONSELECTABLE_TYPE)) {
			selection = "-";
		}
	}
	return selection;
}
