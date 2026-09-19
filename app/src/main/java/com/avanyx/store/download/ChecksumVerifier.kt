package com.avanyx.store.download

import java.io.File
import java.io.FileInputStream
import java.security.MessageDigest

object ChecksumVerifier {

    /**
     * Calculates the SHA-256 hash of a file.
     */
    fun calculateSha256(file: File): String {
        if (!file.exists()) return ""
        val digest = MessageDigest.getInstance("SHA-256")
        val buffer = ByteArray(8192)
        FileInputStream(file).use { stream ->
            var bytesRead: Int
            while (stream.read(buffer).also { bytesRead = it } != -1) {
                digest.update(buffer, 0, bytesRead)
            }
        }
        val hashBytes = digest.digest()
        val sb = StringBuilder()
        for (b in hashBytes) {
            sb.append(String.format("%02x", b))
        }
        return sb.toString()
    }

    /**
     * Verifies file checksum against expected hash.
     * If expected checksum is empty or blank, validation passes by default.
     */
    fun verifyChecksum(file: File, expectedHash: String?): Boolean {
        if (expectedHash.isNullOrBlank()) return true
        val actualHash = calculateSha256(file)
        return actualHash.equals(expectedHash.trim(), ignoreCase = true)
    }
}
