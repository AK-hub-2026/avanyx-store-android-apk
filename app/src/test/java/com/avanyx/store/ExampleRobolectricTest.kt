package com.avanyx.store

import android.content.Context
import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.test.core.app.ApplicationProvider
import com.avanyx.store.data.repository.LocalDemoAppRepository
import com.avanyx.store.ui.screens.SearchScreen
import com.avanyx.store.ui.theme.MyApplicationTheme
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [36])
class ExampleRobolectricTest {

  @get:Rule val composeTestRule = createComposeRule()

  @Test
  fun `read string from context`() {
    val context = ApplicationProvider.getApplicationContext<Context>()
    val appName = context.getString(R.string.app_name)
    assertEquals("AVANYX Store", appName)
  }

  @Test
  fun testSearchFieldClearButton() {
    val repository = LocalDemoAppRepository()
    composeTestRule.setContent {
      MyApplicationTheme {
        SearchScreen(
          repository = repository,
          onNavigateToDetails = {},
          onShowMessage = {}
        )
      }
    }

    // Verify clear button does not exist when search query is empty
    composeTestRule.onNodeWithTag("clear_search_button").assertDoesNotExist()

    // Type a query
    composeTestRule.onNodeWithTag("search_text_input").performTextInput("Chrome")

    // Verify clear button is now displayed
    composeTestRule.onNodeWithTag("clear_search_button").assertIsDisplayed()

    // Click the clear button
    composeTestRule.onNodeWithTag("clear_search_button").performClick()

    // Verify clear button is gone and the text input is cleared
    composeTestRule.onNodeWithTag("clear_search_button").assertDoesNotExist()
  }
}
