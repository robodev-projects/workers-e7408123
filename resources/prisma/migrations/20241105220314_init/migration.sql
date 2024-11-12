-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "email" TEXT,
    "name" TEXT,
    "roles" TEXT[],
    "profilePictureId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthnIdentity" (
    "id" UUID NOT NULL,
    "provider" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuthnIdentity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LocalAuthnIdentity" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "magicLinkCode" TEXT,
    "magicLinkCodeExpiresAt" TIMESTAMP(3),
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "validated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LocalAuthnIdentity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PushNotificationToken" (
    "id" UUID NOT NULL,
    "resourceName" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "title" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PushNotificationToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Media" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "resourceName" TEXT NOT NULL,
    "meta" JSONB,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "uploaded" BOOLEAN NOT NULL DEFAULT false,
    "validated" BOOLEAN NOT NULL DEFAULT false,
    "blob" BYTEA,
    "module" TEXT,
    "type" TEXT,
    "resourceId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" UUID,

    CONSTRAINT "Media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailTemplate" (
    "id" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "label" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "textContent" TEXT,
    "type" TEXT,
    "style" TEXT,

    CONSTRAINT "EmailTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KVStoreItem" (
    "key" TEXT NOT NULL,
    "namespace" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KVStoreItem_pkey" PRIMARY KEY ("key","namespace")
);

-- CreateTable
CREATE TABLE "Rocket" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "pictureId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Rocket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RocketTimelapse" (
    "id" UUID NOT NULL,
    "pictureId" UUID NOT NULL,
    "rocketId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RocketTimelapse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_profilePictureId_key" ON "User"("profilePictureId");

-- CreateIndex
CREATE UNIQUE INDEX "AuthnIdentity_provider_providerId_key" ON "AuthnIdentity"("provider", "providerId");

-- CreateIndex
CREATE UNIQUE INDEX "LocalAuthnIdentity_email_key" ON "LocalAuthnIdentity"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Media_key_key" ON "Media"("key");

-- CreateIndex
CREATE UNIQUE INDEX "EmailTemplate_type_key" ON "EmailTemplate"("type");

-- CreateIndex
CREATE UNIQUE INDEX "Rocket_name_key" ON "Rocket"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Rocket_pictureId_key" ON "Rocket"("pictureId");

-- CreateIndex
CREATE UNIQUE INDEX "RocketTimelapse_pictureId_key" ON "RocketTimelapse"("pictureId");

-- AddForeignKey
ALTER TABLE "RocketTimelapse" ADD CONSTRAINT "RocketTimelapse_rocketId_fkey" FOREIGN KEY ("rocketId") REFERENCES "Rocket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
