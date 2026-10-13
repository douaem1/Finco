package com.finco.service;

import com.finco.exception.RegleMetierException;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;

/** Règles de saisie des tiers (ICE, téléphone, email, RIB, plafond). */
class ReglesTiersTest {

    @Test
    void iceDoitComporter15Chiffres() {
        assertEquals("001524368000085", ReglesTiers.ice("001 524 368 000 085"));
        assertNull(ReglesTiers.ice("  "));
        RegleMetierException e = assertThrows(RegleMetierException.class, () -> ReglesTiers.ice("00152436800008"));
        assertEquals("ice", e.getChamp());
        assertThrows(RegleMetierException.class, () -> ReglesTiers.ice("00152436800008A"));
    }

    @Test
    void telephoneMarocain() {
        assertEquals("0522112233", ReglesTiers.telephone("05 22 11 22 33"));
        assertEquals("+212661000000", ReglesTiers.telephone("00212 661 000 000"));
        assertThrows(RegleMetierException.class, () -> ReglesTiers.telephone("0122112233"));
        assertThrows(RegleMetierException.class, () -> ReglesTiers.telephone("06123"));
    }

    @Test
    void emailEtRib() {
        assertEquals("contact@alpha.ma", ReglesTiers.email(" Contact@Alpha.ma "));
        assertThrows(RegleMetierException.class, () -> ReglesTiers.email("contact@alpha"));
        assertEquals("011780000012345678901234", ReglesTiers.rib("0117 8000 0012 3456 7890 1234"));
        assertThrows(RegleMetierException.class, () -> ReglesTiers.rib("01178000001234567890123"));
    }

    @Test
    void plafondPositifEtDeuxDecimales() {
        assertEquals(new BigDecimal("0"), ReglesTiers.plafondCredit(null));
        assertEquals(new BigDecimal("1500.50"), ReglesTiers.plafondCredit(new BigDecimal("1500.5")));
        assertThrows(RegleMetierException.class, () -> ReglesTiers.plafondCredit(new BigDecimal("-1")));
        assertThrows(RegleMetierException.class, () -> ReglesTiers.plafondCredit(new BigDecimal("10.123")));
    }
}
