/**
 * To set up JavaScript Transformation open configuration space properties
 * and go to "Configuration Space" -> "Transformation Configuration"
 * and add a JavaScript Transformation Module with this JavaScript.
 */


/**
 * Transformation module instance
 */
var pv_module = module_instance();

// Arquivo de log para registrar as features selecionadas
var logFile = new java.io.FileWriter(new java.io.File(pv_module.getOutput(), "debug.log"), true);
function log(msg) {
	logFile.write(msg + "\n");
	logFile.flush();
}

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
	for (var index = 0; index < models.length; index++) {
		var model = new IPVModel(models[index]);
		// we only want to process Feature Models
		if (model.getType().equals(ModelConstants().CFM_TYPE)
			|| model.getType().equals(ModelConstants().FM_TYPE)) {
			var rootid = model.getElementsRootID();
			var rootElement = model.getElementWithID(rootid);
			logSelectedFeatures(rootElement);
			createFeatureClass(rootElement);
		}
	}
} catch (e) {
	// If something went wrong, catch error and return error status with
	// specific error message.
	status.setMessage(e.toString());
	status.setStatus(ClientTransformStatus().ERROR);
}
/**
 * Log features selected recursively
 * @param {IPVElement} element
 */
function logSelectedFeatures(element) {
	log("Feature selecionada: " + element.getVName());
	var iter = element.getChildren().iterator();
	while (iter.hasNext()) {
		logSelectedFeatures(iter.next());
	}
}
	// if no error occurred return OK status
	return status;
}

/**
 * Create a class for each feature
 * @param {IPVElement} element The feature
 */
function createFeatureClass(element) {
	var filename = element.getVName() + ".java";
	var fo = new java.io.FileWriter(new java.io.File(pv_module.getOutput(), filename));

	// if a release state is specified in attribute "state" it will be written to class file
	if (element.hasPropertyWithName("state")) {
		fo.append("//Release state of this feature: ");
		var value = "unknown";
		var constant = element.getPropertyWithName("state").getFirstConstant();
		if (constant != null) {
			value = constant.getValue();
		}
		fo.append(value);
		fo.append("\n\n");
	}

	// write class body of feature to file
	fo.append("public class " + element.getVName() + "{");
	fo.append("\n\n");
	fo.append("}");
	fo.close();

	// get Children of current element
	var iter = element.getChildren().iterator();
	while (iter.hasNext()) {
		createFeatureClass(iter.next());
	}
}
