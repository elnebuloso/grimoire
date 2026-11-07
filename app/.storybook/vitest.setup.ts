// The accessibility addon loads axe on its first check: loaded here, before the first story of a
// file, that load no longer counts against the story's timeout.
import 'axe-core';
