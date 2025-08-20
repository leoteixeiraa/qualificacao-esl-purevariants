// Parent feature: ESL

public class ScreenType {
    private final String typeName;

    public ScreenType(String typeName) {
        this.typeName = typeName;
    }

    public String getTypeName() {
        return typeName;
    }

    public void displayInfo() {
        System.out.println("ScreenType for ESL: " + typeName);
    }

    // Example usage
    public static void main(String[] args) {
        ScreenType lcdScreen = new ScreenType("LCD");
        ScreenType eInkScreen = new ScreenType("E-Ink");

        lcdScreen.displayInfo();
        eInkScreen.displayInfo();
    }
}
