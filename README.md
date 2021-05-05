# gitbucket-overridenewsfeed-plugin

## Background

From [customizing the main page · Issue #1136 · gitbucket/gitbucket · GitHub](https://github.com/gitbucket/gitbucket/issues/1136), there is no current way to customize the main page in GitBucket.

In GitBucket at least from 4.33.0 and up to 4.35.3, the main/landing page for a user (after login):

* by default shows the tabs of what the `gitbucket` software calls Dashboard, and
* by default, the first leftmost tab of the Dashboard tabs, called "News Feed", is selected - and below it shows a historic list of what the `gitbucket` software calls Activities.

In [src/main/twirl/gitbucket/core/index.scala.html at 4.35.3](https://github.com/gitbucket/gitbucket/blob/4.35.3/src/main/twirl/gitbucket/core/index.scala.html):

```
...
    @gitbucket.core.dashboard.html.tab()
    <div class="container">
      <div class="pull-right">
        <a href="@context.path/activities.atom"><img src="@helpers.assets("/common/images/feed.png")" alt="activities"></a>
      </div>
      @gitbucket.core.helper.html.activities(activities)
    </div>
...
```

... there are calls to:

* `@gitbucket.core.dashboard.html.tab()` - likely defined by [tab.scala.html (at 4.35.3)](https://github.com/gitbucket/gitbucket/blob/4.35.3/src/main/twirl/gitbucket/core/dashboard/tab.scala.html)
* `@gitbucket.core.helper.html.activities(activities)` - likely defined by [activities.scala.html (at 4.35.3)](https://github.com/gitbucket/gitbucket/blob/4.35.3/src/main/twirl/gitbucket/core/helper/activities.scala.html)

There are several ways to address this:

* Change  `index.scala.html` (likely not doable by a plugin) - either make the `activites()` call conditional, or insert a new call before it
* Change `activities.scala.html` and related code (likely not doable by a plugin) so it outputs something else
* Add a new leftmost tab to the Dashboard tabs, with a new template, and make it the default (however, that still doesn't change that the `activities()` call in `index.scala.html` is unconditional, and will output regardless)

For GitBucket plugins, see http://gitbucket-plugins.github.io/ and https://gitbucket.github.io/gitbucket-news/gitbucket/2015/06/29/how-to-create-plugin.html

GitBucket plugin hooks can be seen in [PluginRegistry.scala (at 4.35.3)](https://github.com/gitbucket/gitbucket/blob/4.35.3/src/main/scala/gitbucket/core/plugin/PluginRegistry.scala).

There we can see, that there are hooks for `addDashboardTab` and `getDashboardTabs`; so we can in principle change the dashboard tabs from a plugin, but it seem we cannot prepend anything else and make it first.
There seem to be otherwise no hooks containing `activi`ties in the name in the PluginRegistry.


