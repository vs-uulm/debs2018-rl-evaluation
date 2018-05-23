#!/usr/bin/env Rscript
.libPaths('/tmp/')
devtools::install_github('cttobin/ggthemr')

library(stringr)
library(ggplot2)
library(ggthemr)
ggthemr('pale')

outPath <- '/out'
logPath <- '/logs'
headers <- c("method", "url", "latency")
implementations <- list.files(path=logPath)
memfiles = list.files(path=logPath, pattern="memory.csv", recursive=TRUE)

multimerge = function(mypath, pattern) {
  filenames = list.files(path=mypath, pattern=pattern, recursive=TRUE)
  
  datalist = lapply(filenames, function(filename) {
    df <- read.table(
      file=paste(sep="/", mypath, filename),
      col.names = c("method", "url", "latency"),
      header=FALSE,
      sep = ","
    )
    
    segments <- strsplit(filename, "/")
    df$implementation <- segments[[1]][1]
    df$workload <- segments[[1]][2]
    df$latency <- df$latency/10000000
    
    df$action <- paste(df$method, gsub('^[^/]*//[^/]*/', '/', gsub('[0-9]+', '<id>', df$url)))
    df$type <- ifelse(df$method == "GET", "Read API Calls", "Write API Calls")
    
    return(df)
  })
  
  do.call("rbind", datalist)
}

memoryList = lapply(memfiles, function(filename) {
  segments <- strsplit(filename, "/")
  
  df <- read.table(
    file=paste(sep="/", logPath, filename),
    col.names = c("memory"),
    header=FALSE,
    sep = ","
  )
  
  df$memory <- df$memory / 1000000
  df$implementation <- segments[[1]][1]
  df$workload <- segments[[1]][2]
  df$workload <- str_replace(df$workload, "90r10w_10K", "100k (9:1)")
  df$workload <- str_replace(df$workload, "50r50w_10K", "100k (1:1)")
  df$workload <- str_replace(df$workload, "90r10w_100K", "1M (9:1)")
  df$workload <- str_replace(df$workload, "50r50w_100K", "1M (1:1)")
  df$workload <- str_replace(df$workload, "90r10w_1M", "10M (9:1)")
  df$workload <- str_replace(df$workload, "50r50w_1M", "10M (1:1)")
  
  return(df)
})

storageList = lapply(memfiles, function(filename) {
  segments <- strsplit(filename, "/")

  df <- read.table(
    file=paste(sep="/", logPath, segments[[1]][1], segments[[1]][2], "metrics.csv"),
    col.names = c("storage"),
    header=FALSE,
    sep = ","
  )
  
  df$storage <- df$storage / 1000000
  df$implementation <- segments[[1]][1]
  df$workload <- segments[[1]][2]
  df$grp <- paste(df$implementation,str_replace(df$workload, "_.*", ""))
  df$workload <- str_replace(df$workload, "90r10w_10K", "100k (9:1)")
  df$workload <- str_replace(df$workload, "50r50w_10K", "100k (1:1)")
  df$workload <- str_replace(df$workload, "90r10w_100K", "1M (9:1)")
  df$workload <- str_replace(df$workload, "50r50w_100K", "1M (1:1)")
  df$workload <- str_replace(df$workload, "90r10w_1M", "10M (9:1)")
  df$workload <- str_replace(df$workload, "50r50w_1M", "10M (1:1)")
  
  return(df)
})

data = multimerge(logPath, "times.csv")
memoryData <- do.call("rbind", memoryList)
storageData <- do.call("rbind", storageList)
dodge <- position_dodge(width=0.8)

# grouped boxplot 1
c <- ggplot(
  data,
  aes(x=type, y=latency, fill=implementation)
) + stat_boxplot(
  lwd=0.2,
  geom ='errorbar',
  position=dodge,
  color="#000000",
  width=0.7
) + geom_boxplot(
  lwd=0.2,
  outlier.color=NA,
  position=dodge,
  width=0.7
) + theme(
  text = element_text(size=8),
  legend.position = "top",
  legend.background = element_rect(fill="gray90", size=3, color="gray90", linetype="solid"),
  legend.key.size = unit(3, "mm"),
  axis.title.x = element_blank(),
  legend.title = element_blank()
) + ylim(0,1.5) + ylab("processing time [ms]") + xlab("")

ggsave("plot1.pdf", plot = c, device = cairo_pdf, path = outPath,
       scale = 1, width = 85, height = 50, units = "mm", dpi = 300)

# grouped boxplot 2
d <- ggplot(
  data=memoryData,
  aes(x=workload, y=memory, fill=implementation)
) + stat_boxplot(
  lwd=0.2,
  geom ='errorbar',
  color="#000000",
  position=dodge,
  coef=999
) + stat_boxplot(
  lwd=0.2,
  # outlier.color=NA,
  geom ='boxplot',
  position=dodge,
  coef=999
) + geom_point(
  shape = 4,
  data = storageData,
  position=dodge,
  aes(x=workload, y=storage, group=implementation, color=implementation)
) + geom_line(
  data = storageData,
  position=dodge,
  aes(x=workload, y=storage, group=grp, color=implementation)
) + theme(
  text = element_text(size=8),
  legend.position = "top",
  legend.background = element_rect(fill="gray90", size=3, color="gray90", linetype="solid"),
  legend.key.size = unit(3, "mm"),
  axis.title.x = element_blank(),
  legend.title = element_blank()
) + ylab("memory / storage [MB]") + xlab("") + scale_x_discrete(
  limits=c("100k (9:1)", "1M (9:1)", "10M (9:1)", "100k (1:1)", "1M (1:1)", "10M (1:1)")
) + scale_y_log10()

ggsave("plot2.pdf", plot = d, device = cairo_pdf, path = outPath,
       scale = 1, width = 85, height = 50, units = "mm", dpi = 300)
