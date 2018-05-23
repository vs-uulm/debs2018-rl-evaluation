#!/usr/bin/env Rscript
.libPaths('/tmp/')
devtools::install_github('cttobin/ggthemr')

library(plyr)
library(stringr)
library(ggplot2)
library(ggthemr)
ggthemr('pale')

outPath <- '/out'
logPath <- '/logs'

files <- dir(logPath, pattern=".csv")
for (i in 1:length(files)) {
    outFile <- paste(sep="", "plot", (i+2), ".pdf")

    data <- read.csv(paste(sep="/", logPath, files[i]))
    data$executionTime <- data$executionTime/1000000
    data$targetClock <- factor(data$targetClock, levels=c("baseline", "10%", "50%", "90%"))
    data$workload <- str_replace(data$workload, "90r10w_100k", "1M (9:1)")
    data$workload <- str_replace(data$workload, "50r50w_100k", "1M (1:1)")

    df <- ddply(data, c("workload","targetClock"), summarise,
      executionTime25 = quantile(executionTime, .25),
      executionTime = quantile(executionTime, .5),
      executionTime975 = quantile(executionTime, .975))

    dodge <- position_dodge(width=0.9)

    # grouped boxplot 1
    c <- ggplot(
      df,
      aes(x=workload, y=executionTime, fill=targetClock)
    ) + geom_bar(
      lwd=0.2,
      width=.8,
      position=dodge,
      stat="identity"
    ) + geom_errorbar(
      position=dodge,
      width=.3,
      color="#000000",
      aes(ymin=executionTime25, ymax=executionTime975)
    ) + theme(
      text = element_text(size=8),
      legend.position = "top",
      legend.background = element_rect(fill="gray90", size=3, color="gray90", linetype="solid"),
      legend.key.size = unit(3, "mm"),
      axis.title.x = element_blank(),
      legend.title = element_blank()
    ) + ylab("re-execution time [s]")

    c <- c + scale_x_discrete(limits=c("1M (9:1)", "1M (1:1)"))
    c <- c + scale_fill_discrete(limits=c("baseline", "10%", "50%", "90%")) + xlab("")

    ggsave(outFile, plot = c, device = cairo_pdf, path = outPath,
           scale = 1, width = 85, height = 50, units = "mm", dpi = 300)
}

