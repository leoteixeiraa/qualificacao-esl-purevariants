package input.templates;

public class OLED {
    private String resolution;
    private int brightness;

    public OLED(String resolution, int brightness) {
        this.resolution = resolution;
        this.brightness = brightness;
    }

    public String getResolution() {
        return resolution;
    }

    public void setResolution(String resolution) {
        this.resolution = resolution;
    }

    public int getBrightness() {
        return brightness;
    }

    public void setBrightness(int brightness) {
        this.brightness = brightness;
    }

    public void displayLabel(String label) {
        System.out.println("Displaying label on OLED: " + label);
    }

    public static void main(String[] args) {
        OLED oled = new OLED("128x64", 250);
        oled.displayLabel("Preço: R$ 19,99");
        System.out.println("Resolução: " + oled.getResolution());
        System.out.println("Brilho: " + oled.getBrightness());
    }
}
