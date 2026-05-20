-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "phone" TEXT,
    "telegramUsername" TEXT,
    "passwordHash" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "fullName" TEXT,
    "linkToken" TEXT,
    "linkTokenExpiresAt" TIMESTAMP(3),
    "preferredLocale" TEXT NOT NULL DEFAULT 'en',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OtpCode" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumed" BOOLEAN NOT NULL DEFAULT false,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OtpCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TelegramLink" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "username" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "linkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TelegramLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonthlySalary" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'salary',
    "receivedAt" TIMESTAMP(3),
    "isReceived" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MonthlySalary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Budget" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "totalPlanned" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Budget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BudgetCategory" (
    "id" TEXT NOT NULL,
    "budgetId" TEXT NOT NULL,
    "categoryKey" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "plannedAmount" INTEGER NOT NULL,
    "plannedPercent" DOUBLE PRECISION NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "BudgetCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "categoryKey" TEXT,
    "status" TEXT NOT NULL DEFAULT 'categorized',
    "source" TEXT NOT NULL,
    "paymentMethod" TEXT,
    "provider" TEXT,
    "counterparty" TEXT,
    "counterpartyPhone" TEXT,
    "reference" TEXT,
    "balanceAfter" INTEGER,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "forwardedSmsId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ForwardedSms" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rawText" TEXT NOT NULL,
    "provider" TEXT,
    "parsedOk" BOOLEAN NOT NULL DEFAULT false,
    "parsedData" TEXT,
    "parserName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ForwardedSms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "meta" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSettings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'ETB',
    "language" TEXT NOT NULL DEFAULT 'en',
    "telegramNotifications" BOOLEAN NOT NULL DEFAULT true,
    "monthlyReminderEnabled" BOOLEAN NOT NULL DEFAULT true,
    "overspendAlertsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "dailySummaryEnabled" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoommateGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "passwordHash" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoommateGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoommateGroupMember" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "nickname" TEXT,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoommateGroupMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoommateInvite" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "telegramUsername" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "invitedById" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "acceptedUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "respondedAt" TIMESTAMP(3),

    CONSTRAINT "RoommateInvite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoommateExpense" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "categoryKey" TEXT NOT NULL,
    "splitType" TEXT NOT NULL,
    "paidByMemberId" TEXT NOT NULL,
    "createdByMemberId" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "receiptUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoommateExpense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoommateExpenseSplit" (
    "id" TEXT NOT NULL,
    "expenseId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "share" INTEGER NOT NULL,

    CONSTRAINT "RoommateExpenseSplit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoommateLoan" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "lenderMemberId" TEXT NOT NULL,
    "borrowerMemberId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "paid" INTEGER NOT NULL DEFAULT 0,
    "reason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'unpaid',
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoommateLoan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoommateSettlement" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "fromMemberId" TEXT NOT NULL,
    "toMemberId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'recorded',
    "notes" TEXT,
    "settledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoommateSettlement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoommateActivityLog" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "actorMemberId" TEXT,
    "kind" TEXT NOT NULL,
    "payload" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoommateActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoommateGroupSession" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "jti" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "RoommateGroupSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "User_telegramUsername_key" ON "User"("telegramUsername");

-- CreateIndex
CREATE UNIQUE INDEX "User_linkToken_key" ON "User"("linkToken");

-- CreateIndex
CREATE INDEX "User_phone_idx" ON "User"("phone");

-- CreateIndex
CREATE INDEX "User_telegramUsername_idx" ON "User"("telegramUsername");

-- CreateIndex
CREATE INDEX "OtpCode_userId_purpose_idx" ON "OtpCode"("userId", "purpose");

-- CreateIndex
CREATE INDEX "OtpCode_expiresAt_idx" ON "OtpCode"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "TelegramLink_userId_key" ON "TelegramLink"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TelegramLink_chatId_key" ON "TelegramLink"("chatId");

-- CreateIndex
CREATE INDEX "TelegramLink_chatId_idx" ON "TelegramLink"("chatId");

-- CreateIndex
CREATE INDEX "MonthlySalary_userId_month_idx" ON "MonthlySalary"("userId", "month");

-- CreateIndex
CREATE UNIQUE INDEX "MonthlySalary_userId_month_key" ON "MonthlySalary"("userId", "month");

-- CreateIndex
CREATE INDEX "Budget_userId_month_idx" ON "Budget"("userId", "month");

-- CreateIndex
CREATE UNIQUE INDEX "Budget_userId_month_key" ON "Budget"("userId", "month");

-- CreateIndex
CREATE INDEX "BudgetCategory_budgetId_idx" ON "BudgetCategory"("budgetId");

-- CreateIndex
CREATE UNIQUE INDEX "BudgetCategory_budgetId_categoryKey_key" ON "BudgetCategory"("budgetId", "categoryKey");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_forwardedSmsId_key" ON "Transaction"("forwardedSmsId");

-- CreateIndex
CREATE INDEX "Transaction_userId_occurredAt_idx" ON "Transaction"("userId", "occurredAt");

-- CreateIndex
CREATE INDEX "Transaction_userId_status_idx" ON "Transaction"("userId", "status");

-- CreateIndex
CREATE INDEX "Transaction_userId_type_occurredAt_idx" ON "Transaction"("userId", "type", "occurredAt");

-- CreateIndex
CREATE INDEX "Transaction_userId_categoryKey_idx" ON "Transaction"("userId", "categoryKey");

-- CreateIndex
CREATE INDEX "Transaction_reference_idx" ON "Transaction"("reference");

-- CreateIndex
CREATE INDEX "ForwardedSms_userId_createdAt_idx" ON "ForwardedSms"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_userId_read_createdAt_idx" ON "Notification"("userId", "read", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserSettings_userId_key" ON "UserSettings"("userId");

-- CreateIndex
CREATE INDEX "RoommateGroup_createdById_idx" ON "RoommateGroup"("createdById");

-- CreateIndex
CREATE INDEX "RoommateGroupMember_userId_idx" ON "RoommateGroupMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "RoommateGroupMember_groupId_userId_key" ON "RoommateGroupMember"("groupId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "RoommateInvite_token_key" ON "RoommateInvite"("token");

-- CreateIndex
CREATE INDEX "RoommateInvite_groupId_status_idx" ON "RoommateInvite"("groupId", "status");

-- CreateIndex
CREATE INDEX "RoommateInvite_telegramUsername_idx" ON "RoommateInvite"("telegramUsername");

-- CreateIndex
CREATE INDEX "RoommateExpense_groupId_occurredAt_idx" ON "RoommateExpense"("groupId", "occurredAt");

-- CreateIndex
CREATE INDEX "RoommateExpense_groupId_categoryKey_idx" ON "RoommateExpense"("groupId", "categoryKey");

-- CreateIndex
CREATE INDEX "RoommateExpenseSplit_memberId_idx" ON "RoommateExpenseSplit"("memberId");

-- CreateIndex
CREATE UNIQUE INDEX "RoommateExpenseSplit_expenseId_memberId_key" ON "RoommateExpenseSplit"("expenseId", "memberId");

-- CreateIndex
CREATE INDEX "RoommateLoan_groupId_status_idx" ON "RoommateLoan"("groupId", "status");

-- CreateIndex
CREATE INDEX "RoommateLoan_lenderMemberId_idx" ON "RoommateLoan"("lenderMemberId");

-- CreateIndex
CREATE INDEX "RoommateLoan_borrowerMemberId_idx" ON "RoommateLoan"("borrowerMemberId");

-- CreateIndex
CREATE INDEX "RoommateSettlement_groupId_settledAt_idx" ON "RoommateSettlement"("groupId", "settledAt");

-- CreateIndex
CREATE INDEX "RoommateActivityLog_groupId_createdAt_idx" ON "RoommateActivityLog"("groupId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "RoommateGroupSession_jti_key" ON "RoommateGroupSession"("jti");

-- CreateIndex
CREATE INDEX "RoommateGroupSession_memberId_idx" ON "RoommateGroupSession"("memberId");

-- CreateIndex
CREATE INDEX "RoommateGroupSession_expiresAt_idx" ON "RoommateGroupSession"("expiresAt");

-- AddForeignKey
ALTER TABLE "OtpCode" ADD CONSTRAINT "OtpCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TelegramLink" ADD CONSTRAINT "TelegramLink_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonthlySalary" ADD CONSTRAINT "MonthlySalary_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Budget" ADD CONSTRAINT "Budget_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetCategory" ADD CONSTRAINT "BudgetCategory_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "Budget"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_forwardedSmsId_fkey" FOREIGN KEY ("forwardedSmsId") REFERENCES "ForwardedSms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForwardedSms" ADD CONSTRAINT "ForwardedSms_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSettings" ADD CONSTRAINT "UserSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoommateGroup" ADD CONSTRAINT "RoommateGroup_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoommateGroupMember" ADD CONSTRAINT "RoommateGroupMember_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "RoommateGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoommateGroupMember" ADD CONSTRAINT "RoommateGroupMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoommateInvite" ADD CONSTRAINT "RoommateInvite_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "RoommateGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoommateInvite" ADD CONSTRAINT "RoommateInvite_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoommateExpense" ADD CONSTRAINT "RoommateExpense_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "RoommateGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoommateExpense" ADD CONSTRAINT "RoommateExpense_paidByMemberId_fkey" FOREIGN KEY ("paidByMemberId") REFERENCES "RoommateGroupMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoommateExpense" ADD CONSTRAINT "RoommateExpense_createdByMemberId_fkey" FOREIGN KEY ("createdByMemberId") REFERENCES "RoommateGroupMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoommateExpenseSplit" ADD CONSTRAINT "RoommateExpenseSplit_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "RoommateExpense"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoommateExpenseSplit" ADD CONSTRAINT "RoommateExpenseSplit_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "RoommateGroupMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoommateLoan" ADD CONSTRAINT "RoommateLoan_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "RoommateGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoommateLoan" ADD CONSTRAINT "RoommateLoan_lenderMemberId_fkey" FOREIGN KEY ("lenderMemberId") REFERENCES "RoommateGroupMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoommateLoan" ADD CONSTRAINT "RoommateLoan_borrowerMemberId_fkey" FOREIGN KEY ("borrowerMemberId") REFERENCES "RoommateGroupMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoommateSettlement" ADD CONSTRAINT "RoommateSettlement_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "RoommateGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoommateSettlement" ADD CONSTRAINT "RoommateSettlement_fromMemberId_fkey" FOREIGN KEY ("fromMemberId") REFERENCES "RoommateGroupMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoommateSettlement" ADD CONSTRAINT "RoommateSettlement_toMemberId_fkey" FOREIGN KEY ("toMemberId") REFERENCES "RoommateGroupMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoommateActivityLog" ADD CONSTRAINT "RoommateActivityLog_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "RoommateGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoommateActivityLog" ADD CONSTRAINT "RoommateActivityLog_actorMemberId_fkey" FOREIGN KEY ("actorMemberId") REFERENCES "RoommateGroupMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoommateGroupSession" ADD CONSTRAINT "RoommateGroupSession_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "RoommateGroupMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;
