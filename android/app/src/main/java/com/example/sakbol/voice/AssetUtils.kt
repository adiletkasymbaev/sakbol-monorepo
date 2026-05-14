package com.example.sakbol.voice

import android.content.Context
import java.io.File
import java.io.FileOutputStream
import java.io.IOException

/**
 * Копирует директорию из assets в файловую систему приложения
 */
fun copyAssetDirToFiles(context: Context, assetPath: String, destDir: File) {
    val assetManager = context.assets
    
    if (!destDir.exists()) {
        destDir.mkdirs()
    }
    
    try {
        val files = assetManager.list(assetPath) ?: return
        
        if (files.isEmpty()) {
            // Это файл, не директория
            copyAssetFile(context, assetPath, destDir)
        } else {
            // Это директория
            for (file in files) {
                val srcPath = "$assetPath/$file"
                val destPath = File(destDir, file)
                
                val subFiles = assetManager.list(srcPath)
                if (subFiles?.isEmpty() != false) {
                    // Файл
                    copyAssetFile(context, srcPath, destPath)
                } else {
                    // Поддиректория
                    copyAssetDirToFiles(context, srcPath, destPath)
                }
            }
        }
    } catch (e: IOException) {
        e.printStackTrace()
    }
}

private fun copyAssetFile(context: Context, assetPath: String, destFile: File) {
    try {
        context.assets.open(assetPath).use { input ->
            FileOutputStream(destFile).use { output ->
                input.copyTo(output)
            }
        }
    } catch (e: IOException) {
        e.printStackTrace()
    }
}
