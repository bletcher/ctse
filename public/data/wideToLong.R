library('tidyverse')
setwd("D:/projects/ctse/public/data")
dat = read.csv("GLB.Ts+dSST_wide.csv") %>% rename(year = ï..Year)

dat_long = pivot_longer(dat, -year, names_to = "month", values_to = "value")
write.csv(dat_long, "GLB.Ts+dSST_Long.csv")
