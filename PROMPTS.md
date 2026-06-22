
resumable sync

We've been hitting cases where this sync gets interrupted halfway through — sometimes the host gets restarted, sometimes someone Ctrl-C's it, sometimes GitHub flakes out in a way our retry doesn't recover from. Right now when that happens, we have to start over from the beginning, which on the bigger repos is a real pain. Make it resumable.


pluggable widgets

We want users to be able to customize this dashboard — add and remove widgets, reorder them. And from our side, we want it to be easy to add new widget types when product asks (which they will). Make it pluggable.