package input.templates;

public class LCD {
    private String model;
    private int brightness;

    public LCD(String model, int brightness) {
        this.model = model;
        this.brightness = brightness;
    }

    public String getModel() {
        return model;
    }

    public int getBrightness() {
        return brightness;
    }

    public void setBrightness(int brightness) {
        this.brightness = brightness;
        System.out.println("Brightness set to: " + brightness);
    }

    public void displayPrice(String price) {
        System.out.println("Displaying price on LCD: " + price);
    }

    public static void main(String[] args) {
        LCD lcd = new LCD("ESL-LCD-2024", 70);
        lcd.displayPrice("$19.99");
        lcd.setBrightness(80);
    }
}
