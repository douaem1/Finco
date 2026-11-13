package com.finco.dashboard.dto;

import java.math.BigDecimal;

public record DashboardMonthly(int month, BigDecimal revenue, BigDecimal expenses,
                               BigDecimal paymentsReceived, BigDecimal paymentsMade,
                               long entriesValidated, long entriesDraft) {
}