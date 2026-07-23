package com.archetype.lbp.util;

import java.util.Map;

/**
 * Mapping nome colore -> RGB per il filtro colore del catalogo (design doc:
 * virtualz-frontend/docs/color-filter-design.md). Stessi 11 nomi previsti
 * lì per gli swatch della sidebar.
 */
public final class ColorPalette {

    private ColorPalette() {}

    public static final Map<String, int[]> COLORS = Map.ofEntries(
            Map.entry("green", new int[]{50, 205, 50}),
            Map.entry("red", new int[]{178, 34, 34}),
            Map.entry("blue", new int[]{30, 144, 255}),
            Map.entry("yellow", new int[]{255, 215, 0}),
            Map.entry("purple", new int[]{128, 0, 128}),
            Map.entry("orange", new int[]{255, 140, 0}),
            Map.entry("cyan", new int[]{0, 200, 200}),
            Map.entry("brown", new int[]{139, 69, 19}),
            Map.entry("pink", new int[]{255, 105, 180}),
            Map.entry("white", new int[]{240, 240, 240}),
            Map.entry("black", new int[]{20, 20, 20})
    );

    /** @return {r,g,b} del nome colore richiesto, o null se non è nella palette. */
    public static int[] resolve(String colorName) {
        if (colorName == null) return null;
        return COLORS.get(colorName.trim().toLowerCase());
    }
}
